use thiserror::Error;

#[derive(Error, Debug)]
pub enum AgentError {
    #[error("Scan already in progress")]
    ScanInProgress,

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Internal error: {0}")]
    Internal(String),
}

pub type Result<T> = std::result::Result<T, AgentError>;