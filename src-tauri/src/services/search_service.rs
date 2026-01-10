use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub snippet: String,
    pub rank: f64,
    #[serde(rename = "type")]
    pub result_type: String, // "note" or "sticky_note"
}

pub struct SearchService;

impl SearchService {
    pub fn search(
        conn: &Mutex<Connection>,
        query: &str,
    ) -> Result<Vec<SearchResult>, rusqlite::Error> {
        let conn = conn.lock().unwrap();
        let mut results = Vec::new();

        // Search in notes
        let mut stmt = conn.prepare(
            "SELECT id, title, snippet(notes_fts, 2, '<mark>', '</mark>', '...', 32), bm25(notes_fts)
             FROM notes_fts
             WHERE notes_fts MATCH ?1
             ORDER BY bm25(notes_fts)
             LIMIT 50"
        )?;

        let note_rows = stmt.query_map(params![query], |row| {
            Ok(SearchResult {
                id: row.get(0)?,
                title: row.get(1)?,
                snippet: row.get(2)?,
                rank: row.get(3)?,
                result_type: "note".to_string(),
            })
        })?;

        for result in note_rows {
            results.push(result?);
        }

        // Search in sticky notes
        let mut stmt = conn.prepare(
            "SELECT id, snippet(sticky_notes_fts, 1, '<mark>', '</mark>', '...', 64), bm25(sticky_notes_fts)
             FROM sticky_notes_fts
             WHERE sticky_notes_fts MATCH ?1
             ORDER BY bm25(sticky_notes_fts)
             LIMIT 50"
        )?;

        let sticky_rows = stmt.query_map(params![query], |row| {
            let content: String = row.get(1)?;
            // Use first 50 chars of content as title
            let title = if content.len() > 50 {
                format!(
                    "{}...",
                    &content[0..50].replace("<mark>", "").replace("</mark>", "")
                )
            } else {
                content.replace("<mark>", "").replace("</mark>", "")
            };

            Ok(SearchResult {
                id: row.get(0)?,
                title,
                snippet: row.get(1)?,
                rank: row.get(2)?,
                result_type: "sticky_note".to_string(),
            })
        })?;

        for result in sticky_rows {
            results.push(result?);
        }

        // Sort all results by rank (BM25 score)
        results.sort_by(|a, b| {
            a.rank
                .partial_cmp(&b.rank)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        // Limit total results to 50
        results.truncate(50);

        Ok(results)
    }

    pub fn search_by_title(
        conn: &Mutex<Connection>,
        query: &str,
    ) -> Result<Vec<SearchResult>, rusqlite::Error> {
        let conn = conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT id, title, '', 0.0
             FROM notes_fts
             WHERE title MATCH ?1
             ORDER BY bm25(notes_fts)
             LIMIT 20",
        )?;

        let mut results = Vec::new();
        let rows = stmt.query_map(params![query], |row| {
            Ok(SearchResult {
                id: row.get(0)?,
                title: row.get(1)?,
                snippet: row.get(2)?,
                rank: row.get(3)?,
                result_type: "note".to_string(),
            })
        })?;

        for result in rows {
            results.push(result?);
        }

        Ok(results)
    }
}
