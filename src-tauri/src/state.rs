use std::sync::Arc;
use tokio::sync::Mutex as TokioMutex;

use crate::services::database::Database;
use crate::services::file_service::FileService;

pub struct AppState {
    pub db: Arc<Database>,
    pub file_service: Arc<TokioMutex<FileService>>,
}

impl AppState {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let file_service = FileService::new()?;
        let db_path = file_service.get_db_path();
        let db = Database::new(db_path)?;
        
        Ok(AppState {
            db: Arc::new(db),
            file_service: Arc::new(TokioMutex::new(file_service)),
        })
    }
}
