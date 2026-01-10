use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};
use tokio::time::{sleep, Duration};

use crate::services::database::Database;
use crate::utils::json_utils::{extract_plain_text, generate_preview};
use crate::utils::validation::validate_tiptap_json;

const PREVIEW_MAX_LENGTH: usize = 150;

/// SaveOperation represents a pending save
#[derive(Debug, Clone)]
struct SaveOperation {
    note_id: String,
    content: String,
}

/// SaveQueue manages sequential saving of notes to prevent race conditions
pub struct SaveQueue {
    tx: mpsc::Sender<SaveOperation>,
}

impl SaveQueue {
    /// Create a new SaveQueue and start the background processor
    pub fn new(db: Arc<Database>, batch_indexer: Arc<super::batch_indexer::BatchIndexer>) -> Self {
        let (tx, rx) = mpsc::channel::<SaveOperation>(1000);

        // Spawn background task to process saves
        tokio::spawn(async move {
            process_saves(rx, db, batch_indexer).await;
        });

        SaveQueue { tx }
    }

    /// Queue a save operation (non-blocking)
    pub async fn queue_save(&self, note_id: String, content: String) -> Result<(), String> {
        let op = SaveOperation { note_id, content };

        self.tx
            .send(op)
            .await
            .map_err(|e| format!("Failed to queue save: {}", e))
    }
}

/// Background task that processes saves with deduplication
async fn process_saves(
    mut rx: mpsc::Receiver<SaveOperation>,
    db: Arc<Database>,
    batch_indexer: Arc<super::batch_indexer::BatchIndexer>,
) {
    // Buffer to collect operations for a short time
    let mut pending: HashMap<String, String> = HashMap::new();
    let mut last_flush = tokio::time::Instant::now();
    let flush_interval = Duration::from_millis(500); // Flush every 500ms

    loop {
        tokio::select! {
            // Receive new save operations
            Some(op) = rx.recv() => {
                // Store latest content for each note (deduplication)
                pending.insert(op.note_id, op.content);
            }

            // Flush pending saves every 500ms
            _ = sleep(flush_interval), if !pending.is_empty() => {
                if last_flush.elapsed() >= flush_interval {
                    flush_pending_saves(&pending, &db, &batch_indexer).await;
                    pending.clear();
                    last_flush = tokio::time::Instant::now();
                }
            }
        }
    }
}

/// Flush all pending saves to database
async fn flush_pending_saves(
    pending: &HashMap<String, String>,
    db: &Database,
    batch_indexer: &super::batch_indexer::BatchIndexer,
) {
    println!("[SaveQueue] Flushing {} pending saves", pending.len());

    for (note_id, content) in pending.iter() {
        if let Err(e) = save_note_to_db(db, note_id, content, batch_indexer).await {
            eprintln!("[SaveQueue] Failed to save note {}: {}", note_id, e);
        }
    }
}

/// Actually save a note to the database
async fn save_note_to_db(
    db: &Database,
    note_id: &str,
    content: &str,
    batch_indexer: &super::batch_indexer::BatchIndexer,
) -> Result<(), String> {
    // Validate TipTap JSON structure
    validate_tiptap_json(content).map_err(|e| format!("Invalid note content: {}", e))?;

    let now = chrono::Utc::now().timestamp_millis();

    // Generate preview from JSON
    let preview = generate_preview(content, PREVIEW_MAX_LENGTH);

    // Update content in database
    db.update_note_content(note_id, content, preview.as_deref(), now)
        .map_err(|e| format!("Failed to update note content: {}", e))?;

    // Queue for batch re-indexing
    batch_indexer.queue_reindex(note_id.to_string());

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_save_queue_deduplication() {
        // This would require mocking the database
        // For now, just ensure it compiles
    }
}
