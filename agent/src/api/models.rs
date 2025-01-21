use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug)]
pub struct Agent {
    pub id: String,
    pub current_scan: Option<ScanOperation>,
}

#[derive(Debug)]
pub struct ScanOperation {
    pub path: PathBuf,
    pub progress: ScanProgress,
    pub start_time: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ScanProgress {
    pub files_processed: usize,
    pub current_path: Option<PathBuf>,
    pub status: ScanStatus,
    pub results: Option<Vec<FileInfo>>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ScanStatus {
    InProgress,
    Completed,
    Failed(String),
}

#[derive(Debug, Deserialize)]
pub struct ScanRequest {
    pub path: String,
    pub recursive: bool,
    #[serde(default)]
    pub include_patterns: Vec<String>,
    #[serde(default)]
    pub exclude_patterns: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct ScanResponse {
    pub agent_id: String,
}

#[derive(Debug, Serialize)]
pub struct StatusResponse {
    pub scanning: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub progress: Option<ScanProgress>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub results: Option<Vec<FileInfo>>,
}

#[derive(Debug, Clone, Serialize)]
pub struct FileInfo {
    pub path: PathBuf,
    pub size: u64,
    pub modified: DateTime<Utc>,
}