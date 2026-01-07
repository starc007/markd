use rusqlite::{Connection, Result, params};
use std::path::PathBuf;
use std::sync::Mutex;

use crate::models::folder::Folder;
use crate::models::note::NoteMetadata;
use crate::models::sticky_note::StickyNote;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(&db_path)?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        db.initialize()?;
        Ok(db)
    }

    fn initialize(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
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
                preview TEXT,
                file_path TEXT NOT NULL UNIQUE,
                folder_id TEXT,
                pinned INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
            )",
            [],
        )?;

        // Add preview column if it doesn't exist (migration for existing databases)
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN preview TEXT", []);
        // Add pinned column if it doesn't exist (migration for existing databases)
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0", []);

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
            "CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id)",
            [],
        )?;

        Ok(())
    }

    // Note operations
    pub fn insert_note_metadata(
        &self,
        id: &str,
        title: &str,
        file_path: &str,
        folder_id: Option<&str>,
        created_at: i64,
        updated_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO notes (id, title, preview, file_path, folder_id, pinned, created_at, updated_at)
             VALUES (?1, ?2, NULL, ?3, ?4, 0, ?5, ?6)",
            params![id, title, file_path, folder_id, created_at, updated_at],
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
        let conn = self.conn.lock().unwrap();
        
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
        
        Ok(())
    }

    pub fn update_note_preview(
        &self,
        id: &str,
        preview: Option<&str>,
        updated_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE notes SET preview = ?1, updated_at = ?2 WHERE id = ?3",
            params![preview, updated_at, id],
        )?;
        Ok(())
    }

    pub fn delete_note_metadata(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM notes WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_note_metadata(&self, id: &str) -> Result<Option<NoteMetadata>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, preview, folder_id, pinned, created_at, updated_at FROM notes WHERE id = ?1"
        )?;
        
        let mut rows = stmt.query(params![id])?;
        
        if let Some(row) = rows.next()? {
            Ok(Some(NoteMetadata {
                id: row.get(0)?,
                title: row.get(1)?,
                preview: row.get(2)?,
                folder_id: row.get(3)?,
                pinned: row.get::<_, i32>(4)? != 0,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn get_note_file_path(&self, id: &str) -> Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT file_path FROM notes WHERE id = ?1")?;
        let mut rows = stmt.query(params![id])?;
        
        if let Some(row) = rows.next()? {
            Ok(Some(row.get(0)?))
        } else {
            Ok(None)
        }
    }

    pub fn list_notes(&self, folder_id: Option<&str>) -> Result<Vec<NoteMetadata>> {
        let conn = self.conn.lock().unwrap();
        
        let mut notes = Vec::new();
        
        let sql = if folder_id.is_some() {
            "SELECT id, title, preview, folder_id, pinned, created_at, updated_at 
             FROM notes WHERE folder_id = ?1 ORDER BY pinned DESC, updated_at DESC"
        } else {
            "SELECT id, title, preview, folder_id, pinned, created_at, updated_at 
             FROM notes ORDER BY pinned DESC, updated_at DESC"
        };
        
        let mut stmt = conn.prepare(sql)?;
        
        let rows = if let Some(fid) = folder_id {
            stmt.query(params![fid])?
        } else {
            stmt.query([])?
        };
        
        let mapped = rows.mapped(|row| {
            Ok(NoteMetadata {
                id: row.get(0)?,
                title: row.get(1)?,
                preview: row.get(2)?,
                folder_id: row.get(3)?,
                pinned: row.get::<_, i32>(4)? != 0,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        });
        
        for note in mapped {
            notes.push(note?);
        }
        
        Ok(notes)
    }

    pub fn toggle_note_pinned(&self, id: &str, pinned: bool, updated_at: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE notes SET pinned = ?1, updated_at = ?2 WHERE id = ?3",
            params![if pinned { 1 } else { 0 }, updated_at, id],
        )?;
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
        let conn = self.conn.lock().unwrap();
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
        let conn = self.conn.lock().unwrap();
        
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
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM sticky_notes WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_sticky_note(&self, id: &str) -> Result<Option<StickyNote>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, content, color_id, created_at, updated_at FROM sticky_notes WHERE id = ?1"
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
        let conn = self.conn.lock().unwrap();
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
        let conn = self.conn.lock().unwrap();
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
        let conn = self.conn.lock().unwrap();
        
        if let Some(n) = name {
            conn.execute(
                "UPDATE folders SET name = ?1 WHERE id = ?2",
                params![n, id],
            )?;
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
        let conn = self.conn.lock().unwrap();
        // Notes in this folder will have folder_id set to NULL due to ON DELETE SET NULL
        conn.execute("DELETE FROM folders WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_folder(&self, id: &str) -> Result<Option<Folder>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, parent_id, created_at FROM folders WHERE id = ?1"
        )?;
        
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
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, parent_id, created_at FROM folders ORDER BY name"
        )?;
        
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
        let conn = self.conn.lock().unwrap();
        
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
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM notes_fts WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn search(&self, query: &str) -> Result<Vec<crate::services::search_service::SearchResult>> {
        let conn = self.conn.lock().unwrap();
        
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
}
