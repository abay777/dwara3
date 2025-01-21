use std::sync::Arc;
use axum::{
    extract::{Json, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use chrono::Utc;
use tokio::sync::RwLock;

use crate::{
    api::models::{Agent, ScanOperation, ScanProgress, ScanRequest, ScanResponse, StatusResponse, ScanStatus},
    error::{AgentError, Result},
    scanner::walker::scan_directory as walker_scan,
};

pub async fn start_scan(
    State(agent): State<Arc<RwLock<Agent>>>,
    Json(request): Json<ScanRequest>,
) -> axum::response::Response {
    match handle_start_scan(agent, request).await {
        Ok((status, response)) => (status, Json(response)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e.to_string())).into_response(),
    }
}

async fn handle_start_scan(
    agent: Arc<RwLock<Agent>>,
    request: ScanRequest,
) -> Result<(StatusCode, ScanResponse)> {
    let path = std::path::PathBuf::from(&request.path);
    if !path.exists() {
        return Err(AgentError::InvalidPath(request.path));
    }

    // Check if scan already in progress and setup new scan
    {
        let mut agent_lock = agent.write().await;
        if agent_lock.current_scan.is_some() {
            return Err(AgentError::ScanInProgress);
        }

        let operation = ScanOperation {
            path: path.clone(),
            progress: ScanProgress {
                files_processed: 0,
                current_path: None,
                status: ScanStatus::InProgress,
                results: Some(Vec::new()),
            },
            start_time: Utc::now(),
        };

        agent_lock.current_scan = Some(operation);
    }

    // Get agent ID before spawning task
    let agent_id = {
        let agent_lock = agent.read().await;
        agent_lock.id.clone()
    };
    
    // Start scan in background
    let agent_clone = Arc::clone(&agent);
    tokio::spawn(async move {
        let _ = walker_scan(
            path,
            request.recursive,
            request.include_patterns,
            request.exclude_patterns,
            agent_clone,
        ).await;
    });

    Ok((
        StatusCode::ACCEPTED,
        ScanResponse { agent_id }
    ))
}

pub async fn get_status(
    State(agent): State<Arc<RwLock<Agent>>>,
) -> Response {
    let agent = agent.read().await;
    
    let response = match &agent.current_scan {
        Some(scan) => StatusResponse {
            scanning: true,
            progress: Some(scan.progress.clone()),
            results: None, // TODO: Implement results collection
        },
        None => StatusResponse {
            scanning: false,
            progress: None,
            results: None,
        },
    };

    (StatusCode::OK, Json(response)).into_response()
}