use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub snippet: String,
    pub rank: f64,
}

pub struct SearchService;

impl SearchService {
    pub fn search(conn: &Mutex<Connection>, query: &str) -> Result<Vec<SearchResult>, rusqlite::Error> {
        let conn = conn.lock().unwrap();
        
        // Use FTS5 MATCH syntax with BM25 ranking
        let mut stmt = conn.prepare(
            "SELECT id, title, snippet(notes_fts, 2, '<mark>', '</mark>', '...', 32), bm25(notes_fts)
             FROM notes_fts 
             WHERE notes_fts MATCH ?1
             ORDER BY bm25(notes_fts)
             LIMIT 50"
        )?;
        
        let mut results = Vec::new();
        let rows = stmt.query_map(params![query], |row| {
            Ok(SearchResult {
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

    pub fn search_by_title(conn: &Mutex<Connection>, query: &str) -> Result<Vec<SearchResult>, rusqlite::Error> {
        let conn = conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT id, title, '', 0.0
             FROM notes_fts 
             WHERE title MATCH ?1
             ORDER BY bm25(notes_fts)
             LIMIT 20"
        )?;
        
        let mut results = Vec::new();
        let rows = stmt.query_map(params![query], |row| {
            Ok(SearchResult {
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
