use std::sync::Arc;
use std::net::SocketAddr;
use axum::{
    routing::{get, post},
    Router,
};
use tokio::sync::RwLock;
use uuid::Uuid;

mod api;
mod scanner;
mod error;

use crate::api::models::Agent;

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt::init();

    // Create agent instance with unique ID
    let agent = Arc::new(RwLock::new(Agent {
        id: Uuid::new_v4().to_string(),
        current_scan: None,
    }));

    // Build router with agent state
    let app = Router::new()
        .route("/api/v1/scan", post(api::handlers::start_scan))
        .route("/api/v1/scan/status", get(api::handlers::get_status))
        .with_state(agent);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("Starting server on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}