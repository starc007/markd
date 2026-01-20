use lru::LruCache;
use rusqlite::{params, Connection, Result};
use std::num::NonZeroUsize;
use std::path::PathBuf;
use std::sync::Mutex;

use crate::models::folder::Folder;
use crate::models::note::NoteMetadata;
use crate::models::sticky_note::StickyNote;
use crate::services::migrations;
use crate::utils::json_utils::generate_preview;

// Helper macro to acquire database lock with proper error handling
macro_rules! acquire_lock {
    ($mutex:expr) => {
        $mutex.lock().map_err(|e| {
            rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("Database lock poisoned: {}", e),
            )))
        })?
    };
}

pub struct Database {
    conn: Mutex<Connection>,
    // LRU cache for note metadata - significantly speeds up repeated accesses
    // Cache size: 1000 most recently accessed notes
    metadata_cache: Mutex<LruCache<String, NoteMetadata>>,
}

impl Database {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(&db_path)?;
        let cache_size = NonZeroUsize::new(1000).unwrap();
        let db = Database {
            conn: Mutex::new(conn),
            metadata_cache: Mutex::new(LruCache::new(cache_size)),
        };
        db.initialize()?;
        Ok(db)
    }

    fn initialize(&self) -> Result<()> {
        let conn = acquire_lock!(self.conn);

        // Enable Write-Ahead Logging (WAL) mode for better concurrent performance
        // WAL mode allows readers and writers to operate simultaneously
        conn.pragma_update(None, "journal_mode", "WAL")?;

        // Optimize SQLite settings for performance
        conn.pragma_update(None, "synchronous", "NORMAL")?; // Faster writes, still safe
        conn.pragma_update(None, "cache_size", -64000)?; // 64MB cache
        conn.pragma_update(None, "temp_store", "MEMORY")?; // Use memory for temp tables
        conn.pragma_update(None, "mmap_size", 268435456)?; // 256MB memory-mapped I/O

        // Run database migrations
        migrations::run_migrations(&conn)?;

        Ok(())
    }

    // Note operations
    pub fn insert_note(
        &self,
        id: &str,
        title: &str,
        content: &str,
        preview: Option<&str>,
        folder_id: Option<&str>,
        parent_id: Option<&str>,
        created_at: i64,
        updated_at: i64,
    ) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        conn.execute(
            "INSERT INTO notes (id, title, content, preview, file_path, folder_id, parent_id, pinned, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, NULL, ?5, ?6, 0, ?7, ?8)",
            params![id, title, content, preview, folder_id, parent_id, created_at, updated_at],
        )?;
        Ok(())
    }

    pub fn update_note_metadata(
        &self,
        id: &str,
        title: Option<&str>,
        folder_id: Option<Option<&str>>,
        banner_type: Option<Option<&str>>,
        updated_at: i64,
    ) -> Result<()> {
        let conn = acquire_lock!(self.conn);

        if let Some(t) = title {
            conn.execute(
                "UPDATE notes SET title = ?1, updated_at = ?2 WHERE id = ?3",
                params![t, updated_at, id],
            )?;
        }

        if let Some(fid) = folder_id {
            conn.execute(
                "UPDATE notes SET folder_id = ?1, updated_at = ?2 WHERE id = ?3",
                params![fid, updated_at, id],
            )?;
        }

        if let Some(bt) = banner_type {
            conn.execute(
                "UPDATE notes SET banner_type = ?1, updated_at = ?2 WHERE id = ?3",
                params![bt, updated_at, id],
            )?;
        }

        if title.is_none() && folder_id.is_none() && banner_type.is_none() {
            conn.execute(
                "UPDATE notes SET updated_at = ?1 WHERE id = ?2",
                params![updated_at, id],
            )?;
        }

        // Invalidate cache entry since metadata changed
        if let Ok(mut cache) = self.metadata_cache.lock() {
            cache.pop(id);
        }

        Ok(())
    }

    pub fn update_note_preview(
        &self,
        id: &str,
        preview: Option<&str>,
        updated_at: i64,
    ) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        conn.execute(
            "UPDATE notes SET preview = ?1, updated_at = ?2 WHERE id = ?3",
            params![preview, updated_at, id],
        )?;

        // Invalidate cache entry
        if let Ok(mut cache) = self.metadata_cache.lock() {
            cache.pop(id);
        }

        Ok(())
    }

    /// Soft delete a note (move to trash) by setting deleted_at timestamp
    pub fn soft_delete_note_metadata(&self, id: &str) -> Result<()> {
        let now = chrono::Utc::now().timestamp_millis();
        
        // Get backlinks first (before acquiring the main lock to avoid deadlock)
        let backlinks = self.get_backlinks(id)?;

        let conn = acquire_lock!(self.conn);

        // Remove page links from all notes that reference this page before soft deleting
        if !backlinks.is_empty() {
            self.remove_page_links_from_content_with_conn(&conn, id, &backlinks)?;
        }

        // Recursively soft-delete all child notes first
        self.soft_delete_note_children(&conn, id, now)?;

        // Remove from search index (deleted notes shouldn't appear in search)
        conn.execute("DELETE FROM notes_fts WHERE id = ?1", params![id])?;

        // Soft delete the note itself (set deleted_at timestamp)
        conn.execute(
            "UPDATE notes SET deleted_at = ?1 WHERE id = ?2",
            params![now, id],
        )?;

        // Invalidate cache entry
        if let Ok(mut cache) = self.metadata_cache.lock() {
            cache.pop(id);
        }

        Ok(())
    }

    /// Permanently delete a note from database (used for trash cleanup)
    pub fn permanently_delete_note_metadata(&self, id: &str) -> Result<()> {
        // Get backlinks first (before acquiring the main lock)
        let backlinks = self.get_backlinks(id)?;

        let conn = acquire_lock!(self.conn);

        // Remove page links from all notes that reference this page before deleting
        // Pass the connection to avoid deadlocks
        if !backlinks.is_empty() {
            self.remove_page_links_from_content_with_conn(&conn, id, &backlinks)?;
        }

        // Recursively delete all child notes first
        self.delete_note_children(&conn, id)?;

        // Remove from search index (use same connection)
        conn.execute("DELETE FROM notes_fts WHERE id = ?1", params![id])?;

        // Delete the note itself
        conn.execute("DELETE FROM notes WHERE id = ?1", params![id])?;

        // Invalidate cache entry
        if let Ok(mut cache) = self.metadata_cache.lock() {
            cache.pop(id);
        }

        Ok(())
    }

    /// Restore a note from trash (set deleted_at to NULL)
    pub fn restore_note(&self, id: &str) -> Result<()> {
        // Get all descendant IDs and note data first (while holding connection)
        let (all_descendants, note_data) = {
            let conn = acquire_lock!(self.conn);

            // Get all descendant IDs that will be restored (for re-indexing)
            let query = "
                WITH RECURSIVE descendants(id) AS (
                    SELECT id FROM notes WHERE parent_id = ?1 AND deleted_at IS NOT NULL
                    UNION ALL
                    SELECT n.id FROM notes n
                    INNER JOIN descendants d ON n.parent_id = d.id
                    WHERE n.deleted_at IS NOT NULL
                )
                SELECT id FROM descendants
            ";
            let mut stmt = conn.prepare(query)?;
            let all_descendants: Vec<String> = stmt
                .query_map(params![id], |row| Ok(row.get::<_, String>(0)?))?
                .collect::<Result<_, _>>()?;
            drop(stmt); // Explicitly drop statement

            // Get note data for re-indexing before restoring
            let mut note_data: Vec<(String, String, String)> = Vec::new();
            // Include the note itself
            let mut stmt = conn.prepare("SELECT title, content FROM notes WHERE id = ?1")?;
            let mut rows = stmt.query(params![id])?;
            if let Some(row) = rows.next()? {
                let title: String = row.get(0)?;
                let content: String = row.get(1)?;
                note_data.push((id.to_string(), title, content));
            }
            drop(rows);
            drop(stmt); // Explicitly drop statement

            // Include all descendants
            for child_id in &all_descendants {
                let mut stmt = conn.prepare("SELECT title, content FROM notes WHERE id = ?1")?;
                let mut rows = stmt.query(params![child_id])?;
                if let Some(row) = rows.next()? {
                    let title: String = row.get(0)?;
                    let content: String = row.get(1)?;
                    note_data.push((child_id.clone(), title, content));
                }
                drop(rows);
                drop(stmt); // Explicitly drop statement
            }

            // All statements are dropped, connection will be dropped at end of scope
            (all_descendants, note_data)
        };

        // Now restore notes (acquire connection again)
        {
            let conn = acquire_lock!(self.conn);

            // Recursively restore all child notes first
            self.restore_note_children(&conn, id)?;

            // Restore the note itself (set deleted_at to NULL)
            conn.execute("UPDATE notes SET deleted_at = NULL WHERE id = ?1", params![id])?;
        } // Connection dropped here

        // Invalidate cache entry
        if let Ok(mut cache) = self.metadata_cache.lock() {
            cache.pop(id);
            for child_id in &all_descendants {
                cache.pop(child_id);
            }
        }

        // Re-index all restored notes in FTS5 for search
        for (note_id, title, content) in note_data {
            let plain_text = crate::utils::json_utils::extract_plain_text(&content);
            self.index_note(&note_id, &title, &plain_text, "")?;
        }

        Ok(())
    }

    /// List all trashed notes (where deleted_at IS NOT NULL)
    pub fn list_trashed_notes(&self) -> Result<Vec<NoteMetadata>> {
        let conn = acquire_lock!(self.conn);

        let sql = "SELECT n.id, n.title, n.preview, n.folder_id, n.parent_id, n.pinned,
                 COALESCE(c.children_count, 0) as children_count,
                 n.deleted_at, n.created_at, n.updated_at
                 FROM notes n
                 LEFT JOIN (
                     SELECT parent_id, COUNT(*) as children_count
                     FROM notes
                     WHERE deleted_at IS NULL
                     GROUP BY parent_id
                 ) c ON n.id = c.parent_id
                 WHERE n.deleted_at IS NOT NULL
                 ORDER BY n.deleted_at DESC";

        let mut stmt = conn.prepare(sql)?;

        let notes: Result<Vec<NoteMetadata>, _> = stmt
            .query_map([], |row| {
                Ok(NoteMetadata {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    preview: row.get(2)?,
                    folder_id: row.get(3)?,
                    parent_id: row.get(4)?,
                    pinned: row.get::<_, i32>(5)? != 0,
                    children_count: row.get::<_, i32>(6)? as u32,
                    deleted_at: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            })?
            .collect();

        Ok(notes?)
    }

    /// Cleanup expired trash (notes deleted more than 7 days ago)
    pub fn cleanup_expired_trash(&self) -> Result<u32> {
        // Calculate 7 days ago in milliseconds
        let now = chrono::Utc::now().timestamp_millis();
        let seven_days_ms = 7 * 24 * 60 * 60 * 1000;
        let cutoff_time = now - seven_days_ms;

        // Find all notes that should be permanently deleted
        let expired_ids: Vec<String> = {
            let conn = acquire_lock!(self.conn);
            let mut stmt = conn.prepare(
                "SELECT id FROM notes WHERE deleted_at IS NOT NULL AND deleted_at < ?1",
            )?;
            let ids: Vec<String> = stmt
                .query_map(params![cutoff_time], |row| Ok(row.get::<_, String>(0)?))?
                .collect::<Result<_, _>>()?;
            drop(stmt); // Explicitly drop statement
            ids
            // Connection dropped here at end of scope
        };

        let count = expired_ids.len() as u32;

        // Permanently delete each expired note
        for id in expired_ids {
            self.permanently_delete_note_metadata(&id)?;
        }

        Ok(count)
    }

    // Remove page links from content of all notes that reference a deleted page
    // Uses the provided connection to avoid deadlocks
    fn remove_page_links_from_content_with_conn(
        &self,
        conn: &Connection,
        deleted_page_id: &str,
        backlinks: &[String],
    ) -> Result<()> {
        if backlinks.is_empty() {
            return Ok(());
        }

        let now = chrono::Utc::now().timestamp_millis();

        // For each backlink, remove the page link from its content
        for source_page_id in backlinks {
            // Get the note content using the same connection
            let mut stmt = conn.prepare("SELECT content FROM notes WHERE id = ?1")?;
            let mut rows = stmt.query(params![&source_page_id])?;

            let content = match rows.next()? {
                Some(row) => row.get::<_, String>(0)?,
                None => continue,
            };

            // Parse JSON and remove page link nodes
            let updated_content = match serde_json::from_str::<serde_json::Value>(&content) {
                Ok(mut json) => {
                    let mut updated = false;
                    // Recursively find and remove pageLink nodes
                    remove_page_link_from_json(&mut json, deleted_page_id, &mut updated);
                    if updated {
                        serde_json::to_string(&json).map_err(|e| {
                            rusqlite::Error::InvalidColumnType(
                                0,
                                format!("Failed to serialize JSON: {}", e),
                                rusqlite::types::Type::Text,
                            )
                        })?
                    } else {
                        continue; // No changes needed
                    }
                }
                Err(_) => continue, // Skip invalid JSON
            };

            // Update the note content using the same connection
            let preview = generate_preview(&updated_content, PREVIEW_MAX_LENGTH);
            conn.execute(
                "UPDATE notes SET content = ?1, preview = ?2, updated_at = ?3 WHERE id = ?4",
                params![&updated_content, preview.as_deref(), now, &source_page_id],
            )?;

            // Invalidate cache entry
            if let Ok(mut cache) = self.metadata_cache.lock() {
                cache.pop(source_page_id);
            }
        }

        Ok(())
    }

    // Helper function to recursively soft-delete all child notes
    fn soft_delete_note_children(&self, conn: &Connection, parent_id: &str, deleted_at: i64) -> Result<()> {
        // Use a single query with recursive CTE to get all descendant IDs
        let query = "
            WITH RECURSIVE descendants(id) AS (
                SELECT id FROM notes WHERE parent_id = ?1 AND deleted_at IS NULL
                UNION ALL
                SELECT n.id FROM notes n
                INNER JOIN descendants d ON n.parent_id = d.id
                WHERE n.deleted_at IS NULL
            )
            SELECT id FROM descendants
        ";

        let mut stmt = conn.prepare(query)?;
        let all_descendants: Vec<String> = stmt
            .query_map(params![parent_id], |row| Ok(row.get::<_, String>(0)?))?
            .collect::<Result<_, _>>()?;

        // Soft-delete all descendants in batch operations
        if !all_descendants.is_empty() {
            // Batch remove from search index
            let placeholders = all_descendants
                .iter()
                .map(|_| "?")
                .collect::<Vec<_>>()
                .join(",");
            let delete_fts_sql = format!("DELETE FROM notes_fts WHERE id IN ({})", placeholders);
            let mut delete_fts_stmt = conn.prepare(&delete_fts_sql)?;
            let fts_params: Vec<&dyn rusqlite::ToSql> = all_descendants
                .iter()
                .map(|s| s as &dyn rusqlite::ToSql)
                .collect();
            delete_fts_stmt.execute(fts_params.as_slice())?;

            // Batch soft-delete notes (set deleted_at)
            let update_notes_sql = format!("UPDATE notes SET deleted_at = ?1 WHERE id IN ({})", placeholders);
            let mut update_notes_stmt = conn.prepare(&update_notes_sql)?;
            let mut notes_params: Vec<&dyn rusqlite::ToSql> = vec![&deleted_at as &dyn rusqlite::ToSql];
            notes_params.extend(all_descendants.iter().map(|s| s as &dyn rusqlite::ToSql));
            update_notes_stmt.execute(notes_params.as_slice())?;

            // Invalidate cache entries
            if let Ok(mut cache) = self.metadata_cache.lock() {
                for child_id in &all_descendants {
                    cache.pop(child_id);
                }
            }
        }

        Ok(())
    }

    // Helper function to recursively restore all child notes
    fn restore_note_children(&self, conn: &Connection, parent_id: &str) -> Result<()> {
        // Use a single query with recursive CTE to get all descendant IDs that are deleted
        let query = "
            WITH RECURSIVE descendants(id) AS (
                SELECT id FROM notes WHERE parent_id = ?1 AND deleted_at IS NOT NULL
                UNION ALL
                SELECT n.id FROM notes n
                INNER JOIN descendants d ON n.parent_id = d.id
                WHERE n.deleted_at IS NOT NULL
            )
            SELECT id FROM descendants
        ";

        let mut stmt = conn.prepare(query)?;
        let all_descendants: Vec<String> = stmt
            .query_map(params![parent_id], |row| Ok(row.get::<_, String>(0)?))?
            .collect::<Result<_, _>>()?;

        // Restore all descendants in batch operations
        if !all_descendants.is_empty() {
            // Batch restore notes (set deleted_at to NULL)
            let placeholders = all_descendants
                .iter()
                .map(|_| "?")
                .collect::<Vec<_>>()
                .join(",");
            let restore_notes_sql = format!("UPDATE notes SET deleted_at = NULL WHERE id IN ({})", placeholders);
            let mut restore_notes_stmt = conn.prepare(&restore_notes_sql)?;
            let notes_params: Vec<&dyn rusqlite::ToSql> = all_descendants
                .iter()
                .map(|s| s as &dyn rusqlite::ToSql)
                .collect();
            restore_notes_stmt.execute(notes_params.as_slice())?;
        }

        Ok(())
    }

    // Helper function to recursively delete all child notes
    fn delete_note_children(&self, conn: &Connection, parent_id: &str) -> Result<()> {
        // Use a single query with recursive CTE to get all descendant IDs
        // This is more efficient than recursive function calls
        let query = "
            WITH RECURSIVE descendants(id) AS (
                SELECT id FROM notes WHERE parent_id = ?1
                UNION ALL
                SELECT n.id FROM notes n
                INNER JOIN descendants d ON n.parent_id = d.id
            )
            SELECT id FROM descendants
        ";

        let mut stmt = conn.prepare(query)?;
        let all_descendants: Vec<String> = stmt
            .query_map(params![parent_id], |row| Ok(row.get::<_, String>(0)?))?
            .collect::<Result<_, _>>()?;

        // Delete all descendants in batch operations
        if !all_descendants.is_empty() {
            // Batch delete from search index
            let placeholders = all_descendants
                .iter()
                .map(|_| "?")
                .collect::<Vec<_>>()
                .join(",");
            let delete_fts_sql = format!("DELETE FROM notes_fts WHERE id IN ({})", placeholders);
            let mut delete_fts_stmt = conn.prepare(&delete_fts_sql)?;
            let fts_params: Vec<&dyn rusqlite::ToSql> = all_descendants
                .iter()
                .map(|s| s as &dyn rusqlite::ToSql)
                .collect();
            delete_fts_stmt.execute(fts_params.as_slice())?;

            // Batch delete notes
            let delete_notes_sql = format!("DELETE FROM notes WHERE id IN ({})", placeholders);
            let mut delete_notes_stmt = conn.prepare(&delete_notes_sql)?;
            let notes_params: Vec<&dyn rusqlite::ToSql> = all_descendants
                .iter()
                .map(|s| s as &dyn rusqlite::ToSql)
                .collect();
            delete_notes_stmt.execute(notes_params.as_slice())?;

            // Invalidate cache entries
            if let Ok(mut cache) = self.metadata_cache.lock() {
                for child_id in &all_descendants {
                    cache.pop(child_id);
                }
            }
        }

        Ok(())
    }

    pub fn get_note_metadata(&self, id: &str) -> Result<Option<NoteMetadata>> {
        // Check cache first
        if let Ok(mut cache) = self.metadata_cache.lock() {
            if let Some(metadata) = cache.get(id) {
                return Ok(Some(metadata.clone()));
            }
        }

        // Cache miss - query database
        let conn = acquire_lock!(self.conn);
        let mut stmt = conn.prepare(
            "SELECT id, title, preview, folder_id, parent_id, pinned,
             (SELECT COUNT(*) FROM notes WHERE parent_id = notes.id AND deleted_at IS NULL) as children_count,
             deleted_at, created_at, updated_at
             FROM notes WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;

        if let Some(row) = rows.next()? {
            let metadata = NoteMetadata {
                id: row.get(0)?,
                title: row.get(1)?,
                preview: row.get(2)?,
                folder_id: row.get(3)?,
                parent_id: row.get(4)?,
                pinned: row.get::<_, i32>(5)? != 0,
                children_count: row.get::<_, i32>(6)? as u32,
                deleted_at: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            };

            // Store in cache
            if let Ok(mut cache) = self.metadata_cache.lock() {
                cache.put(id.to_string(), metadata.clone());
            }

            Ok(Some(metadata))
        } else {
            Ok(None)
        }
    }

    pub fn get_note_content(&self, id: &str) -> Result<Option<String>> {
        let conn = acquire_lock!(self.conn);
        let mut stmt = conn.prepare("SELECT content FROM notes WHERE id = ?1")?;
        let mut rows = stmt.query(params![id])?;

        if let Some(row) = rows.next()? {
            Ok(Some(row.get(0)?))
        } else {
            Ok(None)
        }
    }

    pub fn update_note_content(
        &self,
        id: &str,
        content: &str,
        preview: Option<&str>,
        updated_at: i64,
    ) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        let rows_affected = conn.execute(
            "UPDATE notes SET content = ?1, preview = ?2, updated_at = ?3 WHERE id = ?4",
            params![content, preview, updated_at, id],
        )?;

        if rows_affected == 0 {
            return Err(rusqlite::Error::QueryReturnedNoRows);
        }

        Ok(())
    }

    pub fn get_note_file_path(&self, id: &str) -> Result<Option<String>> {
        let conn = acquire_lock!(self.conn);
        let mut stmt = conn.prepare("SELECT file_path FROM notes WHERE id = ?1")?;
        let mut rows = stmt.query(params![id])?;

        if let Some(row) = rows.next()? {
            Ok(Some(row.get(0)?))
        } else {
            Ok(None)
        }
    }

    pub fn get_note_banner_type(&self, id: &str) -> Result<Option<String>> {
        let conn = acquire_lock!(self.conn);
        let mut stmt = conn.prepare("SELECT banner_type FROM notes WHERE id = ?1")?;
        let mut rows = stmt.query(params![id])?;

        if let Some(row) = rows.next()? {
            Ok(row.get(0)?)
        } else {
            Ok(None)
        }
    }

    pub fn list_notes(
        &self,
        folder_id: Option<&str>,
        parent_id: Option<&str>,
    ) -> Result<Vec<NoteMetadata>> {
        let conn = acquire_lock!(self.conn);

        // Build optimized query using LEFT JOIN instead of per-row subquery
        // This significantly improves performance when listing many notes
        let notes;
        let (sql, params_vec) = match (folder_id, parent_id) {
            (Some(fid), Some(pid)) => (
                "SELECT n.id, n.title, n.preview, n.folder_id, n.parent_id, n.pinned,
                 COALESCE(c.children_count, 0) as children_count,
                 n.deleted_at, n.created_at, n.updated_at
                 FROM notes n
                 LEFT JOIN (
                     SELECT parent_id, COUNT(*) as children_count
                     FROM notes
                     WHERE deleted_at IS NULL
                     GROUP BY parent_id
                 ) c ON n.id = c.parent_id
                 WHERE n.folder_id = ?1 AND n.parent_id = ?2 AND n.deleted_at IS NULL
                 ORDER BY n.pinned DESC, n.updated_at DESC",
                vec![fid.to_string(), pid.to_string()],
            ),
            (Some(fid), None) => (
                "SELECT n.id, n.title, n.preview, n.folder_id, n.parent_id, n.pinned,
                 COALESCE(c.children_count, 0) as children_count,
                 n.deleted_at, n.created_at, n.updated_at
                 FROM notes n
                 LEFT JOIN (
                     SELECT parent_id, COUNT(*) as children_count
                     FROM notes
                     WHERE deleted_at IS NULL
                     GROUP BY parent_id
                 ) c ON n.id = c.parent_id
                 WHERE n.folder_id = ?1 AND n.parent_id IS NULL AND n.deleted_at IS NULL
                 ORDER BY n.pinned DESC, n.updated_at DESC",
                vec![fid.to_string()],
            ),
            (None, Some(pid)) => (
                "SELECT n.id, n.title, n.preview, n.folder_id, n.parent_id, n.pinned,
                 COALESCE(c.children_count, 0) as children_count,
                 n.deleted_at, n.created_at, n.updated_at
                 FROM notes n
                 LEFT JOIN (
                     SELECT parent_id, COUNT(*) as children_count
                     FROM notes
                     WHERE deleted_at IS NULL
                     GROUP BY parent_id
                 ) c ON n.id = c.parent_id
                 WHERE n.parent_id = ?1 AND n.deleted_at IS NULL
                 ORDER BY n.pinned DESC, n.updated_at DESC",
                vec![pid.to_string()],
            ),
            (None, None) => (
                "SELECT n.id, n.title, n.preview, n.folder_id, n.parent_id, n.pinned,
                 COALESCE(c.children_count, 0) as children_count,
                 n.deleted_at, n.created_at, n.updated_at
                 FROM notes n
                 LEFT JOIN (
                     SELECT parent_id, COUNT(*) as children_count
                     FROM notes
                     WHERE deleted_at IS NULL
                     GROUP BY parent_id
                 ) c ON n.id = c.parent_id
                 WHERE n.parent_id IS NULL AND n.deleted_at IS NULL
                 ORDER BY n.pinned DESC, n.updated_at DESC",
                vec![],
            ),
        };

        let mut stmt = conn.prepare(sql)?;

        // Use query_map to collect all results and release the lock quickly
        let collected_notes: Result<Vec<NoteMetadata>, _> = if !params_vec.is_empty() {
            let params: Vec<&dyn rusqlite::ToSql> = params_vec
                .iter()
                .map(|s| s as &dyn rusqlite::ToSql)
                .collect();
            stmt.query_map(params.as_slice(), |row| {
                Ok(NoteMetadata {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    preview: row.get(2)?,
                    folder_id: row.get(3)?,
                    parent_id: row.get(4)?,
                    pinned: row.get::<_, i32>(5)? != 0,
                    children_count: row.get::<_, i32>(6)? as u32,
                    deleted_at: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            })?
            .collect()
        } else {
            stmt.query_map([], |row| {
                Ok(NoteMetadata {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    preview: row.get(2)?,
                    folder_id: row.get(3)?,
                    parent_id: row.get(4)?,
                    pinned: row.get::<_, i32>(5)? != 0,
                    children_count: row.get::<_, i32>(6)? as u32,
                    deleted_at: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            })?
            .collect()
        };

        // Lock is released here when conn goes out of scope
        notes = collected_notes?;

        Ok(notes)
    }

    // Get children of a specific page
    pub fn get_page_children(&self, parent_id: &str) -> Result<Vec<NoteMetadata>> {
        self.list_notes(None, Some(parent_id))
    }

    // Check if moving a page would create a circular reference
    // Uses a single recursive CTE query instead of multiple queries in a loop
    pub fn would_create_circular_reference(
        &self,
        page_id: &str,
        new_parent_id: &str,
    ) -> Result<bool> {
        // If new parent is the page itself, it's circular
        if page_id == new_parent_id {
            return Ok(true);
        }

        // Use recursive CTE to traverse the entire parent hierarchy in a single query
        let conn = acquire_lock!(self.conn);

        let query = "
            WITH RECURSIVE parent_hierarchy(id, parent_id, depth) AS (
                -- Base case: start with the new parent
                SELECT id, parent_id, 0 as depth
                FROM notes
                WHERE id = ?1

                UNION ALL

                -- Recursive case: follow parent_id chain upward
                SELECT n.id, n.parent_id, h.depth + 1
                FROM notes n
                INNER JOIN parent_hierarchy h ON n.id = h.parent_id
                WHERE h.depth < 100  -- Safety limit to prevent infinite recursion
            )
            SELECT EXISTS(
                SELECT 1 FROM parent_hierarchy WHERE id = ?2
            ) as is_circular
        ";

        let mut stmt = conn.prepare(query)?;
        let is_circular: bool =
            stmt.query_row(params![new_parent_id, page_id], |row| row.get(0))?;

        Ok(is_circular)
    }

    // Update note's parent
    pub fn update_note_parent(
        &self,
        id: &str,
        parent_id: Option<&str>,
        updated_at: i64,
    ) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        conn.execute(
            "UPDATE notes SET parent_id = ?1, updated_at = ?2 WHERE id = ?3",
            params![parent_id, updated_at, id],
        )?;

        // Invalidate cache entry
        if let Ok(mut cache) = self.metadata_cache.lock() {
            cache.pop(id);
        }

        Ok(())
    }

    pub fn toggle_note_pinned(&self, id: &str, pinned: bool, updated_at: i64) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        conn.execute(
            "UPDATE notes SET pinned = ?1, updated_at = ?2 WHERE id = ?3",
            params![if pinned { 1 } else { 0 }, updated_at, id],
        )?;

        // Invalidate cache entry
        if let Ok(mut cache) = self.metadata_cache.lock() {
            cache.pop(id);
        }

        Ok(())
    }

    

    // Sticky Notes operations
    pub fn insert_sticky_note(
        &self,
        id: &str,
        content: &str,
        color_id: &str,
        created_at: i64,
        updated_at: i64,
    ) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        conn.execute(
            "INSERT INTO sticky_notes (id, content, color_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, content, color_id, created_at, updated_at],
        )?;

        // Insert into FTS table
        conn.execute(
            "INSERT INTO sticky_notes_fts (id, content) VALUES (?1, ?2)",
            params![id, content],
        )?;

        Ok(())
    }

    pub fn update_sticky_note(
        &self,
        id: &str,
        content: Option<&str>,
        color_id: Option<&str>,
        updated_at: i64,
    ) -> Result<()> {
        let conn = acquire_lock!(self.conn);

        if let Some(c) = content {
            conn.execute(
                "UPDATE sticky_notes SET content = ?1, updated_at = ?2 WHERE id = ?3",
                params![c, updated_at, id],
            )?;

            // Update FTS table
            conn.execute(
                "UPDATE sticky_notes_fts SET content = ?1 WHERE id = ?2",
                params![c, id],
            )?;
        }

        if let Some(cid) = color_id {
            conn.execute(
                "UPDATE sticky_notes SET color_id = ?1, updated_at = ?2 WHERE id = ?3",
                params![cid, updated_at, id],
            )?;
        }

        if content.is_none() && color_id.is_none() {
            conn.execute(
                "UPDATE sticky_notes SET updated_at = ?1 WHERE id = ?2",
                params![updated_at, id],
            )?;
        }

        Ok(())
    }

    pub fn delete_sticky_note(&self, id: &str) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        conn.execute("DELETE FROM sticky_notes WHERE id = ?1", params![id])?;

        // Delete from FTS table
        conn.execute("DELETE FROM sticky_notes_fts WHERE id = ?1", params![id])?;

        Ok(())
    }

    pub fn get_sticky_note(&self, id: &str) -> Result<Option<StickyNote>> {
        let conn = acquire_lock!(self.conn);
        let mut stmt = conn.prepare(
            "SELECT id, content, color_id, created_at, updated_at FROM sticky_notes WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;

        if let Some(row) = rows.next()? {
            Ok(Some(StickyNote {
                id: row.get(0)?,
                content: row.get(1)?,
                color_id: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn list_sticky_notes(&self) -> Result<Vec<StickyNote>> {
        let conn = acquire_lock!(self.conn);
        let mut stmt = conn.prepare(
            "SELECT id, content, color_id, created_at, updated_at FROM sticky_notes ORDER BY updated_at DESC"
        )?;

        let mut sticky_notes = Vec::new();
        let rows = stmt.query_map([], |row| {
            Ok(StickyNote {
                id: row.get(0)?,
                content: row.get(1)?,
                color_id: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })?;

        for note in rows {
            sticky_notes.push(note?);
        }

        Ok(sticky_notes)
    }

    // Bookmark operations
    pub fn insert_bookmark(
        &self,
        id: &str,
        url: &str,
        title: &str,
        tags: Option<&str>,
        folder_id: Option<&str>,
        favicon: Option<&str>,
        created_at: i64,
        updated_at: i64,
    ) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        conn.execute(
            "INSERT INTO bookmarks (id, url, title, tags, folder_id, favicon, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![id, url, title, tags, folder_id, favicon, created_at, updated_at],
        )?;

        // Insert into FTS table
        conn.execute(
            "INSERT INTO bookmarks_fts (id, url, title, tags) VALUES (?1, ?2, ?3, ?4)",
            params![id, url, title, tags.unwrap_or("")],
        )?;

        Ok(())
    }

    pub fn update_bookmark(
        &self,
        id: &str,
        url: Option<&str>,
        title: Option<&str>,
        tags: Option<&str>,
        updated_at: i64,
    ) -> Result<()> {
        // Get current bookmark to get favicon if title is being updated
        let favicon = if title.is_some() {
            let conn = acquire_lock!(self.conn);
            let mut stmt = conn.prepare("SELECT favicon FROM bookmarks WHERE id = ?1")?;
            let mut rows = stmt.query(params![id])?;
            let result = if let Some(row) = rows.next()? {
                row.get::<_, Option<String>>(0)?
            } else {
                None
            };
            drop(rows);
            drop(stmt);
            drop(conn);
            result
        } else {
            None
        };

        let conn = acquire_lock!(self.conn);

        if let Some(u) = url {
            conn.execute(
                "UPDATE bookmarks SET url = ?1, updated_at = ?2 WHERE id = ?3",
                params![u, updated_at, id],
            )?;

            conn.execute(
                "UPDATE bookmarks_fts SET url = ?1 WHERE id = ?2",
                params![u, id],
            )?;
        }

        if let Some(t) = title {
            conn.execute(
                "UPDATE bookmarks SET title = ?1, updated_at = ?2 WHERE id = ?3",
                params![t, updated_at, id],
            )?;

            conn.execute(
                "UPDATE bookmarks_fts SET title = ?1 WHERE id = ?2",
                params![t, id],
            )?;
        }

        if let Some(t) = tags {
            conn.execute(
                "UPDATE bookmarks SET tags = ?1, updated_at = ?2 WHERE id = ?3",
                params![t, updated_at, id],
            )?;

            conn.execute(
                "UPDATE bookmarks_fts SET tags = ?1 WHERE id = ?2",
                params![t, id],
            )?;
        }

        drop(conn); // Release lock before calling update_bookmark_links_in_notes

        // Update bookmark links in all notes that reference this bookmark
        if let Some(t) = title {
            self.update_bookmark_links_in_notes(id, t, favicon.as_deref())?;
        }

        Ok(())
    }

    /// Update bookmark link titles and favicons in all notes that reference this bookmark
    pub fn update_bookmark_links_in_notes(
        &self,
        bookmark_id: &str,
        new_title: &str,
        new_favicon: Option<&str>,
    ) -> Result<()> {
        self.update_all_notes_with_bookmark(bookmark_id, Some(new_title), new_favicon)
    }

    /// Helper function to update or remove bookmark links in all notes
    fn update_all_notes_with_bookmark(
        &self,
        bookmark_id: &str,
        new_title: Option<&str>,
        new_favicon: Option<&str>,
    ) -> Result<()> {
        let conn = acquire_lock!(self.conn);

        // Get all notes
        let mut stmt = conn.prepare("SELECT id, content FROM notes")?;
        let notes: Vec<(String, String)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        drop(stmt);

        // Update each note's content
        for (note_id, content) in notes {
            if let Ok(mut json) = serde_json::from_str::<serde_json::Value>(&content) {
                let mut updated = false;

                if let Some(title) = new_title {
                    // Update bookmark link
                    update_bookmark_link_in_json(
                        &mut json,
                        bookmark_id,
                        title,
                        new_favicon,
                        &mut updated,
                    );
                } else {
                    // Remove bookmark link
                    remove_bookmark_link_from_json(&mut json, bookmark_id, &mut updated);
                }

                if updated {
                    let updated_content = serde_json::to_string(&json)
                        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
                    let now = chrono::Utc::now().timestamp_millis();

                    conn.execute(
                        "UPDATE notes SET content = ?1, updated_at = ?2 WHERE id = ?3",
                        params![updated_content, now, note_id],
                    )?;

                    // Update FTS
                    conn.execute(
                        "UPDATE notes_fts SET content = ?1 WHERE id = ?2",
                        params![updated_content, note_id],
                    )?;
                }
            }
        }

        Ok(())
    }

    pub fn delete_bookmark(&self, id: &str) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        conn.execute("DELETE FROM bookmarks WHERE id = ?1", params![id])?;

        // Delete from FTS table
        conn.execute("DELETE FROM bookmarks_fts WHERE id = ?1", params![id])?;

        drop(conn); // Release lock before calling update_all_notes_with_bookmark

        // Remove bookmark links from all notes
        self.update_all_notes_with_bookmark(id, None, None)?;

        Ok(())
    }

    pub fn get_bookmark(&self, id: &str) -> Result<Option<crate::models::bookmark::Bookmark>> {
        let conn = acquire_lock!(self.conn);
        let mut stmt = conn.prepare(
            "SELECT id, url, title, tags, folder_id, favicon, created_at, updated_at FROM bookmarks WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;

        if let Some(row) = rows.next()? {
            Ok(Some(crate::models::bookmark::Bookmark {
                id: row.get(0)?,
                url: row.get(1)?,
                title: row.get(2)?,
                tags: row.get(3)?,
                folder_id: row.get(4)?,
                favicon: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn list_bookmarks(
        &self,
        folder_id: Option<&str>,
    ) -> Result<Vec<crate::models::bookmark::BookmarkMetadata>> {
        let conn = acquire_lock!(self.conn);
        let mut bookmarks = Vec::new();

        if let Some(fid) = folder_id {
            let mut stmt = conn.prepare(
                "SELECT id, url, title, tags, folder_id, favicon, created_at, updated_at
                 FROM bookmarks
                 WHERE folder_id = ?1
                 ORDER BY created_at DESC",
            )?;

            let rows = stmt.query_map([fid], |row| {
                Ok(crate::models::bookmark::BookmarkMetadata {
                    id: row.get(0)?,
                    url: row.get(1)?,
                    title: row.get(2)?,
                    tags: row.get(3)?,
                    folder_id: row.get(4)?,
                    favicon: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })?;

            for bookmark in rows {
                bookmarks.push(bookmark?);
            }
        } else {
            let mut stmt = conn.prepare(
                "SELECT id, url, title, tags, folder_id, favicon, created_at, updated_at
                 FROM bookmarks
                 WHERE folder_id IS NULL
                 ORDER BY created_at DESC",
            )?;

            let rows = stmt.query_map([], |row| {
                Ok(crate::models::bookmark::BookmarkMetadata {
                    id: row.get(0)?,
                    url: row.get(1)?,
                    title: row.get(2)?,
                    tags: row.get(3)?,
                    folder_id: row.get(4)?,
                    favicon: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })?;

            for bookmark in rows {
                bookmarks.push(bookmark?);
            }
        }

        Ok(bookmarks)
    }

    

    // Folder operations
    pub fn insert_folder(
        &self,
        id: &str,
        name: &str,
        parent_id: Option<&str>,
        created_at: i64,
    ) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        conn.execute(
            "INSERT INTO folders (id, name, parent_id, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![id, name, parent_id, created_at],
        )?;
        Ok(())
    }

    pub fn update_folder(
        &self,
        id: &str,
        name: Option<&str>,
        parent_id: Option<Option<&str>>,
    ) -> Result<()> {
        let conn = acquire_lock!(self.conn);

        if let Some(n) = name {
            conn.execute("UPDATE folders SET name = ?1 WHERE id = ?2", params![n, id])?;
        }

        if let Some(pid) = parent_id {
            conn.execute(
                "UPDATE folders SET parent_id = ?1 WHERE id = ?2",
                params![pid, id],
            )?;
        }

        Ok(())
    }

    pub fn delete_folder(&self, id: &str) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        // Notes in this folder will have folder_id set to NULL due to ON DELETE SET NULL
        conn.execute("DELETE FROM folders WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_folder(&self, id: &str) -> Result<Option<Folder>> {
        let conn = acquire_lock!(self.conn);
        let mut stmt =
            conn.prepare("SELECT id, name, parent_id, created_at FROM folders WHERE id = ?1")?;

        let mut rows = stmt.query(params![id])?;

        if let Some(row) = rows.next()? {
            Ok(Some(Folder {
                id: row.get(0)?,
                name: row.get(1)?,
                parent_id: row.get(2)?,
                created_at: row.get(3)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn list_folders(&self) -> Result<Vec<Folder>> {
        let conn = acquire_lock!(self.conn);
        let mut stmt =
            conn.prepare("SELECT id, name, parent_id, created_at FROM folders ORDER BY name")?;

        let mut folders = Vec::new();
        let rows = stmt.query_map([], |row| {
            Ok(Folder {
                id: row.get(0)?,
                name: row.get(1)?,
                parent_id: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?;

        for folder in rows {
            folders.push(folder?);
        }

        Ok(folders)
    }

    // FTS operations
    pub fn index_note(&self, id: &str, title: &str, content: &str, tags: &str) -> Result<()> {
        let conn = acquire_lock!(self.conn);

        // Delete existing entry if present
        conn.execute("DELETE FROM notes_fts WHERE id = ?1", params![id])?;

        // Insert new entry
        conn.execute(
            "INSERT INTO notes_fts (id, title, content, tags) VALUES (?1, ?2, ?3, ?4)",
            params![id, title, content, tags],
        )?;

        Ok(())
    }

    pub fn remove_from_index(&self, id: &str) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        conn.execute("DELETE FROM notes_fts WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn search(
        &self,
        query: &str,
    ) -> Result<Vec<crate::services::search_service::SearchResult>> {
        use crate::services::search_service::SearchService;
        SearchService::search(&self.conn, query)
    }

    // Page linking operations
    pub fn create_page_link(
        &self,
        id: &str,
        source_page_id: &str,
        target_page_id: &str,
        created_at: i64,
    ) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        conn.execute(
            "INSERT OR IGNORE INTO page_links (id, source_page_id, target_page_id, created_at)
             VALUES (?1, ?2, ?3, ?4)",
            params![id, source_page_id, target_page_id, created_at],
        )?;
        Ok(())
    }

    pub fn delete_page_link(&self, source_page_id: &str, target_page_id: &str) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        conn.execute(
            "DELETE FROM page_links WHERE source_page_id = ?1 AND target_page_id = ?2",
            params![source_page_id, target_page_id],
        )?;
        Ok(())
    }

    pub fn get_linked_pages(&self, page_id: &str) -> Result<Vec<String>> {
        let conn = acquire_lock!(self.conn);
        let mut stmt =
            conn.prepare("SELECT target_page_id FROM page_links WHERE source_page_id = ?1")?;

        let mut linked = Vec::new();
        let rows = stmt.query_map(params![page_id], |row| Ok(row.get::<_, String>(0)?))?;

        for page_id in rows {
            linked.push(page_id?);
        }

        Ok(linked)
    }

    pub fn get_backlinks(&self, page_id: &str) -> Result<Vec<String>> {
        let conn = acquire_lock!(self.conn);
        let mut stmt =
            conn.prepare("SELECT source_page_id FROM page_links WHERE target_page_id = ?1")?;

        let mut backlinks = Vec::new();
        let rows = stmt.query_map(params![page_id], |row| Ok(row.get::<_, String>(0)?))?;

        for page_id in rows {
            backlinks.push(page_id?);
        }

        Ok(backlinks)
    }

    // Extract and sync page links from content
    // Optimized to use batch operations instead of individual queries
    pub fn sync_page_links(
        &self,
        page_id: &str,
        linked_page_ids: &[String],
        now: i64,
    ) -> Result<()> {
        let conn = acquire_lock!(self.conn);

        // Get current links
        let mut stmt =
            conn.prepare("SELECT target_page_id FROM page_links WHERE source_page_id = ?1")?;
        let current_links: std::collections::HashSet<String> = stmt
            .query_map(params![page_id], |row| Ok(row.get::<_, String>(0)?))?
            .collect::<Result<_, _>>()?;

        let new_links: std::collections::HashSet<String> =
            linked_page_ids.iter().cloned().collect();

        // Find links to remove and add
        let to_remove: Vec<_> = current_links.difference(&new_links).collect();
        let to_add: Vec<_> = new_links.difference(&current_links).collect();

        // Batch delete removed links
        if !to_remove.is_empty() {
            // Build placeholders for IN clause
            let placeholders = to_remove.iter().map(|_| "?").collect::<Vec<_>>().join(",");
            let delete_sql = format!(
                "DELETE FROM page_links WHERE source_page_id = ? AND target_page_id IN ({})",
                placeholders
            );

            let mut delete_stmt = conn.prepare(&delete_sql)?;
            let mut delete_params: Vec<&dyn rusqlite::ToSql> =
                vec![&page_id as &dyn rusqlite::ToSql];
            for target in &to_remove {
                delete_params.push(*target as &dyn rusqlite::ToSql);
            }
            delete_stmt.execute(delete_params.as_slice())?;
        }

        // Batch insert new links
        if !to_add.is_empty() {
            // Build multi-row INSERT
            let value_placeholders = to_add
                .iter()
                .map(|_| "(?, ?, ?, ?)")
                .collect::<Vec<_>>()
                .join(",");
            let insert_sql = format!(
                "INSERT OR IGNORE INTO page_links (id, source_page_id, target_page_id, created_at) VALUES {}",
                value_placeholders
            );

            let mut insert_stmt = conn.prepare(&insert_sql)?;
            let mut insert_params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
            for target in &to_add {
                let link_id = uuid::Uuid::new_v4().to_string();
                insert_params.push(Box::new(link_id));
                insert_params.push(Box::new(page_id.to_string()));
                insert_params.push(Box::new((*target).to_string()));
                insert_params.push(Box::new(now));
            }

            let params_refs: Vec<&dyn rusqlite::ToSql> = insert_params
                .iter()
                .map(|p| p.as_ref() as &dyn rusqlite::ToSql)
                .collect();
            insert_stmt.execute(params_refs.as_slice())?;
        }

        Ok(())
    }

    // Update page link titles in all notes that reference a specific page
    pub fn update_page_link_titles(
        &self,
        target_page_id: &str,
        new_title: &str,
        now: i64,
    ) -> Result<()> {
        // Get all notes that link to this page (backlinks)
        let backlinks = self.get_backlinks(target_page_id)?;

        if backlinks.is_empty() {
            return Ok(());
        }

        // For each backlink, update the page link title in its content
        for source_page_id in backlinks {
            // Get the note content
            let content = match self.get_note_content(&source_page_id)? {
                Some(c) => c,
                None => continue,
            };

            // Parse JSON and update page link titles
            let updated_content = match serde_json::from_str::<serde_json::Value>(&content) {
                Ok(mut json) => {
                    let mut updated = false;
                    // Recursively find and update pageLink nodes
                    update_page_link_in_json(&mut json, target_page_id, new_title, &mut updated);
                    if updated {
                        serde_json::to_string(&json).map_err(|e| {
                            rusqlite::Error::InvalidColumnType(
                                0,
                                format!("Failed to serialize JSON: {}", e),
                                rusqlite::types::Type::Text,
                            )
                        })?
                    } else {
                        continue; // No changes needed
                    }
                }
                Err(_) => continue, // Skip invalid JSON
            };

            // Update the note content
            let preview = generate_preview(&updated_content, PREVIEW_MAX_LENGTH);
            self.update_note_content(&source_page_id, &updated_content, preview.as_deref(), now)?;
        }

        Ok(())
    }

    // Visual identity operations
    pub fn insert_visual_identity(
        &self,
        note_id: &str,
        gradient_colors: &[String],
        pattern_type: &str,
        pattern_data: Option<&str>,
        image_data: Option<&str>,
        created_at: i64,
        updated_at: i64,
    ) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        let gradient_colors_json = serde_json::to_string(gradient_colors)
            .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
        
        conn.execute(
            "INSERT OR REPLACE INTO note_visual_identity 
             (note_id, gradient_colors, pattern_type, pattern_data, image_data, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                note_id,
                gradient_colors_json,
                pattern_type,
                pattern_data,
                image_data,
                created_at,
                updated_at
            ],
        )?;
        Ok(())
    }

    pub fn get_visual_identity(&self, note_id: &str) -> Result<Option<crate::models::visual_identity::NoteVisualIdentity>> {
        let conn = acquire_lock!(self.conn);
        let mut stmt = conn.prepare(
            "SELECT note_id, gradient_colors, pattern_type, pattern_data, image_data, created_at, updated_at
             FROM note_visual_identity WHERE note_id = ?1"
        )?;

        let result = stmt.query_row(params![note_id], |row| {
            let gradient_colors_json: String = row.get(1)?;
            let gradient_colors: Vec<String> = serde_json::from_str(&gradient_colors_json)
                .unwrap_or_else(|_| vec![]);
            
            Ok(crate::models::visual_identity::NoteVisualIdentity {
                note_id: row.get(0)?,
                gradient_colors,
                pattern_type: row.get(2)?,
                pattern_data: row.get(3)?,
                image_data: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        });

        match result {
            Ok(identity) => Ok(Some(identity)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn delete_visual_identity(&self, note_id: &str) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        conn.execute(
            "DELETE FROM note_visual_identity WHERE note_id = ?1",
            params![note_id],
        )?;
        Ok(())
    }

    pub fn list_all_note_ids(&self) -> Result<Vec<String>> {
        let conn = acquire_lock!(self.conn);
        let mut stmt = conn.prepare("SELECT id FROM notes")?;
        let mut note_ids = Vec::new();
        let rows = stmt.query_map([], |row| {
            Ok(row.get::<_, String>(0)?)
        })?;

        for row in rows {
            note_ids.push(row?);
        }

        Ok(note_ids)
    }
}

// Helper function to recursively update page link titles in JSON
fn update_page_link_in_json(
    node: &mut serde_json::Value,
    target_page_id: &str,
    new_title: &str,
    updated: &mut bool,
) {
    match node {
        serde_json::Value::Object(obj) => {
            // Check if this is a pageLink node
            if let Some(serde_json::Value::String(node_type)) = obj.get("type") {
                if node_type == "pageLink" {
                    if let Some(serde_json::Value::Object(attrs)) = obj.get_mut("attrs") {
                        if let Some(serde_json::Value::String(page_id)) = attrs.get("pageId") {
                            if page_id == target_page_id {
                                attrs.insert(
                                    "pageTitle".to_string(),
                                    serde_json::Value::String(new_title.to_string()),
                                );
                                *updated = true;
                            }
                        }
                    }
                }
            }

            // Recursively process content array
            if let Some(serde_json::Value::Array(content)) = obj.get_mut("content") {
                for item in content.iter_mut() {
                    update_page_link_in_json(item, target_page_id, new_title, updated);
                }
            }
        }
        serde_json::Value::Array(arr) => {
            for item in arr.iter_mut() {
                update_page_link_in_json(item, target_page_id, new_title, updated);
            }
        }
        _ => {}
    }
}

// Helper function to recursively remove page link nodes from JSON
fn remove_page_link_from_json(
    node: &mut serde_json::Value,
    deleted_page_id: &str,
    updated: &mut bool,
) {
    match node {
        serde_json::Value::Object(obj) => {
            // Check if this is a pageLink node that should be removed
            if let Some(serde_json::Value::String(node_type)) = obj.get("type") {
                if node_type == "pageLink" {
                    if let Some(serde_json::Value::Object(attrs)) = obj.get("attrs") {
                        if let Some(serde_json::Value::String(page_id)) = attrs.get("pageId") {
                            if page_id == deleted_page_id {
                                // Mark for removal - we'll handle this at the parent level
                                return;
                            }
                        }
                    }
                }
            }

            // Recursively process content array
            if let Some(serde_json::Value::Array(content)) = obj.get_mut("content") {
                let mut i = 0;
                while i < content.len() {
                    // Check if this child should be removed
                    let should_remove = {
                        let item = &content[i];
                        if let Some(serde_json::Value::String(node_type)) = item.get("type") {
                            if node_type == "pageLink" {
                                if let Some(serde_json::Value::Object(attrs)) = item.get("attrs") {
                                    if let Some(serde_json::Value::String(page_id)) =
                                        attrs.get("pageId")
                                    {
                                        page_id == deleted_page_id
                                    } else {
                                        false
                                    }
                                } else {
                                    false
                                }
                            } else {
                                false
                            }
                        } else {
                            false
                        }
                    };

                    if should_remove {
                        content.remove(i);
                        *updated = true;
                    } else {
                        // Recursively process children
                        remove_page_link_from_json(&mut content[i], deleted_page_id, updated);
                        i += 1;
                    }
                }
            }
        }
        serde_json::Value::Array(arr) => {
            let mut i = 0;
            while i < arr.len() {
                // Check if this item should be removed
                let should_remove = {
                    let item = &arr[i];
                    if let Some(serde_json::Value::String(node_type)) = item.get("type") {
                        if node_type == "pageLink" {
                            if let Some(serde_json::Value::Object(attrs)) = item.get("attrs") {
                                if let Some(serde_json::Value::String(page_id)) =
                                    attrs.get("pageId")
                                {
                                    page_id == deleted_page_id
                                } else {
                                    false
                                }
                            } else {
                                false
                            }
                        } else {
                            false
                        }
                    } else {
                        false
                    }
                };

                if should_remove {
                    arr.remove(i);
                    *updated = true;
                } else {
                    // Recursively process children
                    remove_page_link_from_json(&mut arr[i], deleted_page_id, updated);
                    i += 1;
                }
            }
        }
        _ => {}
    }
}

/// Update bookmark link titles and favicons in all notes
fn update_bookmark_link_in_json(
    value: &mut serde_json::Value,
    bookmark_id: &str,
    new_title: &str,
    new_favicon: Option<&str>,
    updated: &mut bool,
) {
    match value {
        serde_json::Value::Object(obj) => {
            // Check if this is a bookmarkLink node with matching bookmarkId
            if let Some(serde_json::Value::String(node_type)) = obj.get("type") {
                if node_type == "bookmarkLink" {
                    if let Some(serde_json::Value::Object(attrs)) = obj.get_mut("attrs") {
                        if let Some(serde_json::Value::String(id)) = attrs.get("bookmarkId") {
                            if id == bookmark_id {
                                // Update title
                                attrs.insert(
                                    "title".to_string(),
                                    serde_json::Value::String(new_title.to_string()),
                                );

                                // Update favicon
                                if let Some(favicon) = new_favicon {
                                    attrs.insert(
                                        "favicon".to_string(),
                                        serde_json::Value::String(favicon.to_string()),
                                    );
                                } else {
                                    attrs.insert("favicon".to_string(), serde_json::Value::Null);
                                }

                                *updated = true;
                            }
                        }
                    }
                }
            }

            // Recursively process all object values
            for (_key, val) in obj.iter_mut() {
                update_bookmark_link_in_json(val, bookmark_id, new_title, new_favicon, updated);
            }
        }
        serde_json::Value::Array(arr) => {
            for item in arr.iter_mut() {
                update_bookmark_link_in_json(item, bookmark_id, new_title, new_favicon, updated);
            }
        }
        _ => {}
    }
}

/// Remove bookmark links from JSON content
fn remove_bookmark_link_from_json(
    value: &mut serde_json::Value,
    deleted_bookmark_id: &str,
    updated: &mut bool,
) {
    match value {
        serde_json::Value::Object(obj) => {
            if let Some(content) = obj.get_mut("content") {
                if let serde_json::Value::Array(content) = content {
                    let mut i = 0;
                    while i < content.len() {
                        let should_remove = {
                            let item = &content[i];
                            if let Some(serde_json::Value::String(node_type)) = item.get("type") {
                                if node_type == "bookmarkLink" {
                                    if let Some(serde_json::Value::Object(attrs)) =
                                        item.get("attrs")
                                    {
                                        if let Some(serde_json::Value::String(bookmark_id)) =
                                            attrs.get("bookmarkId")
                                        {
                                            bookmark_id == deleted_bookmark_id
                                        } else {
                                            false
                                        }
                                    } else {
                                        false
                                    }
                                } else {
                                    false
                                }
                            } else {
                                false
                            }
                        };

                        if should_remove {
                            content.remove(i);
                            *updated = true;
                        } else {
                            remove_bookmark_link_from_json(
                                &mut content[i],
                                deleted_bookmark_id,
                                updated,
                            );
                            i += 1;
                        }
                    }
                }
            }
        }
        serde_json::Value::Array(arr) => {
            let mut i = 0;
            while i < arr.len() {
                let should_remove = {
                    let item = &arr[i];
                    if let Some(serde_json::Value::String(node_type)) = item.get("type") {
                        if node_type == "bookmarkLink" {
                            if let Some(serde_json::Value::Object(attrs)) = item.get("attrs") {
                                if let Some(serde_json::Value::String(bookmark_id)) =
                                    attrs.get("bookmarkId")
                                {
                                    bookmark_id == deleted_bookmark_id
                                } else {
                                    false
                                }
                            } else {
                                false
                            }
                        } else {
                            false
                        }
                    } else {
                        false
                    }
                };

                if should_remove {
                    arr.remove(i);
                    *updated = true;
                } else {
                    remove_bookmark_link_from_json(&mut arr[i], deleted_bookmark_id, updated);
                    i += 1;
                }
            }
        }
        _ => {}
    }
}

const PREVIEW_MAX_LENGTH: usize = 150;
