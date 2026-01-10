use std::collections::HashSet;
use std::sync::Mutex;
use std::time::{Duration, Instant};

/// BatchIndexer queues note IDs for re-indexing and processes them in batches
/// This prevents excessive re-indexing operations during rapid content changes
pub struct BatchIndexer {
    pending_ids: Mutex<HashSet<String>>,
    last_index_time: Mutex<Instant>,
    batch_interval: Duration,
}

impl BatchIndexer {
    pub fn new(batch_interval_seconds: u64) -> Self {
        Self {
            pending_ids: Mutex::new(HashSet::new()),
            last_index_time: Mutex::new(Instant::now()),
            batch_interval: Duration::from_secs(batch_interval_seconds),
        }
    }

    /// Queue a note for re-indexing
    pub fn queue_reindex(&self, note_id: String) {
        let mut pending = self.pending_ids.lock().unwrap();
        pending.insert(note_id);
    }

    /// Check if it's time to process the batch
    pub fn should_process_batch(&self) -> bool {
        let last_time = self.last_index_time.lock().unwrap();
        last_time.elapsed() >= self.batch_interval
    }

    /// Get pending IDs and clear the queue
    pub fn get_pending_and_clear(&self) -> Vec<String> {
        let mut pending = self.pending_ids.lock().unwrap();
        let ids = pending.iter().cloned().collect();
        pending.clear();

        let mut last_time = self.last_index_time.lock().unwrap();
        *last_time = Instant::now();

        ids
    }

    /// Get the number of pending items
    pub fn pending_count(&self) -> usize {
        self.pending_ids.lock().unwrap().len()
    }
}

/// Start a background task that processes the batch indexer periodically
pub fn start_batch_indexer_task<F>(indexer: std::sync::Arc<BatchIndexer>, process_fn: F)
where
    F: Fn(Vec<String>) + Send + 'static,
{
    tauri::async_runtime::spawn(async move {
        loop {
            // Sleep for 1 second
            tokio::time::sleep(Duration::from_secs(1)).await;

            // Check if we should process
            if indexer.should_process_batch() && indexer.pending_count() > 0 {
                let ids = indexer.get_pending_and_clear();
                if !ids.is_empty() {
                    println!("[BatchIndexer] Processing {} notes", ids.len());
                    process_fn(ids);
                }
            }
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use std::thread;

    #[test]
    fn test_queue_reindex() {
        let indexer = BatchIndexer::new(5);

        indexer.queue_reindex("note1".to_string());
        indexer.queue_reindex("note2".to_string());
        indexer.queue_reindex("note1".to_string()); // Duplicate

        assert_eq!(indexer.pending_count(), 2); // Duplicates not counted
    }

    #[test]
    fn test_should_process_batch() {
        let indexer = BatchIndexer::new(1); // 1 second interval

        assert!(!indexer.should_process_batch()); // Just created

        thread::sleep(Duration::from_millis(1100));
        assert!(indexer.should_process_batch());
    }

    #[test]
    fn test_get_pending_and_clear() {
        let indexer = BatchIndexer::new(5);

        indexer.queue_reindex("note1".to_string());
        indexer.queue_reindex("note2".to_string());

        thread::sleep(Duration::from_secs(6));

        let ids = indexer.get_pending_and_clear();
        assert_eq!(ids.len(), 2);
        assert_eq!(indexer.pending_count(), 0);
    }
}
