use std::sync::Arc;

use crate::services::batch_indexer::BatchIndexer;
use crate::services::database::Database;
use crate::services::save_queue::SaveQueue;
use crate::services::trash_cleanup::TrashCleanup;

pub struct AppState {
    pub db: Arc<Database>,
    pub batch_indexer: Arc<BatchIndexer>,
    pub save_queue: Arc<SaveQueue>,
    pub trash_cleanup: Arc<TrashCleanup>,
}

impl AppState {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        // Get database path directly
        let db_path = dirs::document_dir()
            .ok_or_else(|| {
                std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "Documents directory not found",
                )
            })?
            .join("Draft")
            .join("draft.db");

        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let db = Arc::new(Database::new(db_path)?);

        // Create batch indexer with 5-second interval
        let batch_indexer = Arc::new(BatchIndexer::new(5));

        // Start background task for batch indexing
        let db_clone = Arc::clone(&db);
        let indexer_clone = Arc::clone(&batch_indexer);
        crate::services::batch_indexer::start_batch_indexer_task(indexer_clone, move |note_ids| {
            for note_id in note_ids {
                if let Err(e) = reindex_note(&db_clone, &note_id) {
                    eprintln!("[BatchIndexer] Failed to reindex note {}: {}", note_id, e);
                }
            }
        });

        // Create save queue (processes saves sequentially with deduplication)
        let save_queue = Arc::new(SaveQueue::new(Arc::clone(&db), Arc::clone(&batch_indexer)));

        // Create trash cleanup service
        let trash_cleanup = Arc::new(TrashCleanup::new(Arc::clone(&db)));

        // Start background task for periodic trash cleanup (runs on startup and every hour)
        let trash_cleanup_clone = Arc::clone(&trash_cleanup);
        crate::services::trash_cleanup::start_trash_cleanup_task(trash_cleanup_clone);

        Ok(AppState {
            db,
            batch_indexer,
            save_queue,
            trash_cleanup,
        })
    }
}

// Helper function to re-index a single note
fn reindex_note(db: &Database, note_id: &str) -> Result<(), String> {
    use crate::utils::json_utils::extract_plain_text;

    let note = db
        .get_note_metadata(note_id)
        .map_err(|e| format!("Failed to get note: {}", e))?;

    if let Some(note_meta) = note {
        let content = db
            .get_note_content(note_id)
            .map_err(|e| format!("Failed to get content: {}", e))?
            .unwrap_or_default();

        let plain_text = extract_plain_text(&content);
        db.index_note(note_id, &note_meta.title, &plain_text, "")
            .map_err(|e| format!("Failed to index: {}", e))?;
    }

    Ok(())
}
