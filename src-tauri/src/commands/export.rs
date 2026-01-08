use std::fs;
use std::path::PathBuf;
use tauri::State;

use crate::state::AppState;

#[tauri::command]
pub async fn export_note(
    state: State<'_, AppState>,
    note_id: String,
    destination: String,
    markdown_content: String,
) -> Result<(), String> {
    let dest_path = PathBuf::from(&destination);

    // Write markdown content (converted by frontend) to file
    fs::write(&dest_path, markdown_content).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_note_content_for_export(
    state: State<'_, AppState>,
    note_id: String,
) -> Result<String, String> {
    // Return JSON content - frontend will convert to markdown
    state
        .db
        .get_note_content(&note_id)
        .map_err(|e| format!("Failed to get note content: {}", e))?
        .ok_or_else(|| "Note not found".to_string())
}
