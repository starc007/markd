use tauri::State;

use crate::state::AppState;
use crate::services::search_service::SearchResult;

#[tauri::command]
pub async fn search_notes(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<SearchResult>, String> {
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }
    
    // Format query for FTS5 - add * for prefix matching
    let formatted_query = format_fts_query(&query);
    
    // Access the database connection through a dedicated search method
    let db = &state.db;
    
    // We need to search directly using the database
    search_in_db(db, &formatted_query)
        .map_err(|e| format!("Search failed: {}", e))
}

fn format_fts_query(query: &str) -> String {
    // Split into words and add prefix matching
    let words: Vec<String> = query
        .split_whitespace()
        .map(|word| {
            // Escape special FTS5 characters and add prefix matching
            let escaped = word
                .replace("\"", "\"\"")
                .replace("*", "")
                .replace("(", "")
                .replace(")", "");
            format!("{}*", escaped)
        })
        .collect();
    
    words.join(" ")
}

fn search_in_db(db: &crate::services::database::Database, query: &str) -> Result<Vec<SearchResult>, String> {
    // We'll add a search method to the Database struct
    db.search(query).map_err(|e| e.to_string())
}
