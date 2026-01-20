use std::sync::Arc;
use std::time::Duration;

use crate::services::database::Database;

/// TrashCleanup manages periodic cleanup of expired trash
pub struct TrashCleanup {
    db: Arc<Database>,
}

impl TrashCleanup {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    /// Run cleanup of expired trash (notes deleted more than 7 days ago)
    pub fn cleanup_expired(&self) -> Result<u32, String> {
        self.db
            .cleanup_expired_trash()
            .map_err(|e| format!("Failed to cleanup expired trash: {}", e))
    }
}

/// Start a background task that periodically cleans up expired trash
pub fn start_trash_cleanup_task(cleanup: Arc<TrashCleanup>) {
    tauri::async_runtime::spawn(async move {
        // Run cleanup on startup
        match cleanup.cleanup_expired() {
            Ok(count) => {
                if count > 0 {
                    println!("[TrashCleanup] Cleaned up {} expired notes on startup", count);
                }
            }
            Err(e) => {
                eprintln!("[TrashCleanup] Failed to cleanup on startup: {}", e);
            }
        }

        // Then run cleanup every hour
        loop {
            tokio::time::sleep(Duration::from_secs(3600)).await;

            match cleanup.cleanup_expired() {
                Ok(count) => {
                    if count > 0 {
                        println!("[TrashCleanup] Cleaned up {} expired notes", count);
                    }
                }
                Err(e) => {
                    eprintln!("[TrashCleanup] Failed to cleanup expired trash: {}", e);
                }
            }
        }
    });
}
