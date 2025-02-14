use std::sync::Arc;
use std::net::SocketAddr;
use axum::{
    routing::{get, post},
    Router,
};
use tokio::sync::RwLock;
use tower_http::cors::{Any, CorsLayer}; // Import CORS middleware
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

    // Add CORS middleware
    let cors = CorsLayer::new()
        .allow_origin(Any)  // Allow any frontend to access it
        .allow_methods([axum::http::Method::GET, axum::http::Method::POST]) // Allow GET & POST
        .allow_headers(Any); // Allow all headers

    // Build router with agent state
    let app = Router::new()
        .route("/api/v1/scan", post(api::handlers::start_scan))
        .route("/api/v1/scan/status", get(api::handlers::get_status))
        .layer(cors)  // Add CORS Layer
        .with_state(agent);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("Starting server on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
