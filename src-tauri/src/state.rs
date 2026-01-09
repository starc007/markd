use std::sync::Arc;

use crate::services::database::Database;

pub struct AppState {
    pub db: Arc<Database>,
}

impl AppState {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        // Get database path directly
        let db_path = dirs::document_dir()
            .ok_or_else(|| std::io::Error::new(
                std::io::ErrorKind::NotFound,
                "Documents directory not found"
            ))?
            .join("Draft")
            .join("draft.db");
        
        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        
        let db = Database::new(db_path)?;
        
        Ok(AppState {
            db: Arc::new(db),
        })
    }
}
