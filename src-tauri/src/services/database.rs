use lru::LruCache;
use rusqlite::{params, Connection, Result};
use std::num::NonZeroUsize;
use std::path::PathBuf;
use std::sync::Mutex;

use crate::models::folder::Folder;
use crate::models::note::NoteMetadata;
use crate::models::sticky_note::StickyNote;

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

        // Create folders table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parent_id TEXT,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE SET NULL
            )",
            [],
        )?;

        // Create notes metadata table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                preview TEXT,
                file_path TEXT,
                folder_id TEXT,
                parent_id TEXT,
                pinned INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
                FOREIGN KEY (parent_id) REFERENCES notes(id) ON DELETE SET NULL
            )",
            [],
        )?;

        // Create sticky_notes table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS sticky_notes (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                color_id TEXT NOT NULL DEFAULT 'default',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Create tags table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS tags (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL
            )",
            [],
        )?;

        // Create note_tags junction table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS note_tags (
                note_id TEXT NOT NULL,
                tag_id TEXT NOT NULL,
                PRIMARY KEY (note_id, tag_id),
                FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Create FTS5 virtual table for full-text search
        conn.execute(
            "CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
                id UNINDEXED,
                title,
                content,
                tags,
                tokenize='porter unicode61'
            )",
            [],
        )?;

        // Create page_links table for tracking page references
        conn.execute(
            "CREATE TABLE IF NOT EXISTS page_links (
                id TEXT PRIMARY KEY,
                source_page_id TEXT NOT NULL,
                target_page_id TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (source_page_id) REFERENCES notes(id) ON DELETE CASCADE,
                FOREIGN KEY (target_page_id) REFERENCES notes(id) ON DELETE CASCADE,
                UNIQUE(source_page_id, target_page_id)
            )",
            [],
        )?;

        // Create indexes for better performance
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_parent ON notes(parent_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_page_links_source ON page_links(source_page_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_page_links_target ON page_links(target_page_id)",
            [],
        )?;

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

        if title.is_none() && folder_id.is_none() {
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

    pub fn delete_note_metadata(&self, id: &str) -> Result<()> {
        let conn = acquire_lock!(self.conn);
        conn.execute("DELETE FROM notes WHERE id = ?1", params![id])?;

        // Invalidate cache entry
        if let Ok(mut cache) = self.metadata_cache.lock() {
            cache.pop(id);
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
             (SELECT COUNT(*) FROM notes WHERE parent_id = notes.id) as children_count,
             created_at, updated_at
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
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
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
        eprintln!(
            "[database::update_note_content] Updating note {} with content length: {}",
            id,
            content.len()
        );
        let conn = acquire_lock!(self.conn);
        let rows_affected = conn.execute(
            "UPDATE notes SET content = ?1, preview = ?2, updated_at = ?3 WHERE id = ?4",
            params![content, preview, updated_at, id],
        )?;
        eprintln!(
            "[database::update_note_content] Rows affected: {}",
            rows_affected
        );

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
                 n.created_at, n.updated_at
                 FROM notes n
                 LEFT JOIN (
                     SELECT parent_id, COUNT(*) as children_count
                     FROM notes
                     GROUP BY parent_id
                 ) c ON n.id = c.parent_id
                 WHERE n.folder_id = ?1 AND n.parent_id = ?2
                 ORDER BY n.pinned DESC, n.updated_at DESC",
                vec![fid.to_string(), pid.to_string()],
            ),
            (Some(fid), None) => (
                "SELECT n.id, n.title, n.preview, n.folder_id, n.parent_id, n.pinned,
                 COALESCE(c.children_count, 0) as children_count,
                 n.created_at, n.updated_at
                 FROM notes n
                 LEFT JOIN (
                     SELECT parent_id, COUNT(*) as children_count
                     FROM notes
                     GROUP BY parent_id
                 ) c ON n.id = c.parent_id
                 WHERE n.folder_id = ?1 AND n.parent_id IS NULL
                 ORDER BY n.pinned DESC, n.updated_at DESC",
                vec![fid.to_string()],
            ),
            (None, Some(pid)) => (
                "SELECT n.id, n.title, n.preview, n.folder_id, n.parent_id, n.pinned,
                 COALESCE(c.children_count, 0) as children_count,
                 n.created_at, n.updated_at
                 FROM notes n
                 LEFT JOIN (
                     SELECT parent_id, COUNT(*) as children_count
                     FROM notes
                     GROUP BY parent_id
                 ) c ON n.id = c.parent_id
                 WHERE n.parent_id = ?1
                 ORDER BY n.pinned DESC, n.updated_at DESC",
                vec![pid.to_string()],
            ),
            (None, None) => (
                "SELECT n.id, n.title, n.preview, n.folder_id, n.parent_id, n.pinned,
                 COALESCE(c.children_count, 0) as children_count,
                 n.created_at, n.updated_at
                 FROM notes n
                 LEFT JOIN (
                     SELECT parent_id, COUNT(*) as children_count
                     FROM notes
                     GROUP BY parent_id
                 ) c ON n.id = c.parent_id
                 WHERE n.parent_id IS NULL
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
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
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
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
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
        let conn = acquire_lock!(self.conn);

        let mut stmt = conn.prepare(
            "SELECT id, title, snippet(notes_fts, 2, '<mark>', '</mark>', '...', 32), bm25(notes_fts)
             FROM notes_fts
             WHERE notes_fts MATCH ?1
             ORDER BY bm25(notes_fts)
             LIMIT 50"
        )?;

        let mut results = Vec::new();
        let rows = stmt.query_map(params![query], |row| {
            Ok(crate::services::search_service::SearchResult {
                id: row.get(0)?,
                title: row.get(1)?,
                snippet: row.get(2)?,
                rank: row.get(3)?,
            })
        })?;

        for result in rows {
            results.push(result?);
        }

        Ok(results)
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
}
