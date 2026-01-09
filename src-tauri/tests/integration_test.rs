
// Run with: cargo test --test integration_test

use usedraft_lib::state::AppState;
use tempfile::TempDir;

fn create_test_state() -> Result<AppState, Box<dyn std::error::Error>> {
    // Create a temporary directory for testing
    let temp_dir = TempDir::new()?;
    let db_path = temp_dir.path().join("test.db");
    
    // Create database in temp location
    let db = usedraft_lib::services::database::Database::new(db_path)?;
    
    Ok(AppState {
        db: std::sync::Arc::new(db),
    })
}

#[test]
fn test_database_initialization() {
    let state = create_test_state();
    assert!(state.is_ok());
}

#[test]
fn test_note_validation() {
    use usedraft_lib::utils::validation::validate_tiptap_json;
    
    // Valid JSON
    let valid = r#"{"type":"doc","content":[{"type":"paragraph"}]}"#;
    assert!(validate_tiptap_json(valid).is_ok());
    
    // Invalid JSON
    let invalid = r#"{"type":"invalid"}"#;
    assert!(validate_tiptap_json(invalid).is_err());
}

#[test]
fn test_search_query_sanitization() {
    use usedraft_lib::utils::validation::{sanitize_search_query, create_fts5_query};
    
    // Test sanitization
    assert_eq!(sanitize_search_query("hello world"), "hello world");
    assert_eq!(sanitize_search_query("hello\"world"), "hello\"\"world");
    
    // Test FTS5 query creation
    assert_eq!(create_fts5_query("hello"), "hello*");
    assert_eq!(create_fts5_query("hello world"), "hello* AND world*");
}
