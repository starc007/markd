use tauri::State;

use crate::state::AppState;
use crate::services::search_service::SearchResult;
use crate::utils::validation::create_fts5_query;

#[tauri::command]
pub async fn search_notes(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<SearchResult>, String> {
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }
    
    // Sanitize and format query for FTS5
    let formatted_query = create_fts5_query(&query);
    
    if formatted_query.is_empty() {
        return Ok(Vec::new());
    }
    
    // Access the database connection through a dedicated search method
    let db = &state.db;
    
    // We need to search directly using the database
    search_in_db(db, &formatted_query)
        .map_err(|e| format!("Search failed: {}", e))
}

fn search_in_db(db: &crate::services::database::Database, query: &str) -> Result<Vec<SearchResult>, String> {
    // We'll add a search method to the Database struct
    db.search(query).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::validation::{sanitize_search_query, create_fts5_query};

    #[test]
    fn test_sanitize_search_query() {
        // Normal query
        assert_eq!(sanitize_search_query("hello world"), "hello world");
        
        // Query with special characters
        assert_eq!(sanitize_search_query("hello\"world"), "hello\"\"world");
        
        // Query with script tags (should be removed)
        assert_eq!(sanitize_search_query("hello<script>"), "hello");
        
        // Query with multiple spaces
        assert_eq!(sanitize_search_query("hello   world"), "hello world");
    }

    #[test]
    fn test_create_fts5_query() {
        // Single term
        assert_eq!(create_fts5_query("hello"), "hello*");
        
        // Multiple terms
        assert_eq!(create_fts5_query("hello world"), "hello* AND world*");
        
        // Empty query
        assert_eq!(create_fts5_query(""), "");
        
        // Query with special characters
        let result = create_fts5_query("test query");
        assert!(result.contains("test*"));
        assert!(result.contains("query*"));
    }

    #[test]
    fn test_search_notes_empty_query() {
        // Empty queries should return empty results
        assert_eq!(sanitize_search_query("   "), "");
    }
}
