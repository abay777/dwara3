use std::{path::PathBuf, sync::Arc};
use tokio::{fs, sync::RwLock};
use futures::future::BoxFuture;

use crate::{
    api::models::{Agent, FileInfo, ScanStatus},
    error::Result,
};

pub fn scan_directory(
    root: PathBuf,
    recursive: bool,
    include_patterns: Vec<String>,
    exclude_patterns: Vec<String>,
    agent: Arc<RwLock<Agent>>,
) -> BoxFuture<'static, Result<()>> {
    Box::pin(async move {
        let mut entries = fs::read_dir(&root).await?;
        let mut files_processed = 0;

        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            
            // Update current path in progress
            {
                let mut agent = agent.write().await;
                if let Some(scan) = &mut agent.current_scan {
                    scan.progress.current_path = Some(path.clone());
                    scan.progress.files_processed = files_processed;
                }
            }

            // Process file
            if path.is_file() {
                // Skip if doesn't match include patterns
                if !include_patterns.is_empty() && !matches_any(&path, &include_patterns) {
                    continue;
                }
                // Skip if matches exclude patterns
                if !exclude_patterns.is_empty() && matches_any(&path, &exclude_patterns) {
                    continue;
                }

                let metadata = fs::metadata(&path).await?;
                let file_info = FileInfo {
                    path: path.clone(),
                    size: metadata.len(),
                    modified: metadata.modified()?.into(),
                };
    
                // Store file_info in agent's current scan
                let mut agent = agent.write().await;
                if let Some(scan) = &mut agent.current_scan {
                    if scan.progress.results.is_none() {
                        scan.progress.results = Some(Vec::new());
                    }
                    if let Some(results) = &mut scan.progress.results {
                        results.push(file_info);
                    }
                }
                files_processed += 1;
            } else if recursive && path.is_dir() {
                // Recursively scan subdirectories
                scan_directory(
                    path,
                    recursive,
                    include_patterns.clone(),
                    exclude_patterns.clone(),
                    Arc::clone(&agent),
                ).await?;
            }
        }

        // Update final status
        {
            let mut agent = agent.write().await;
            if let Some(scan) = &mut agent.current_scan {
                scan.progress.status = ScanStatus::Completed;
                scan.progress.files_processed = files_processed;
                scan.progress.current_path = None;
            }
        }

        Ok(())
    })
}

fn matches_any(path: &PathBuf, patterns: &[String]) -> bool {
    let path_str = path.to_string_lossy();
    patterns.iter().any(|pattern| {
        path_str.contains(pattern)
    })
}