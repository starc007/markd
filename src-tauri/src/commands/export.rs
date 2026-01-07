use std::path::PathBuf;
use tauri::State;

use crate::state::AppState;

#[tauri::command]
pub async fn export_note(
    state: State<'_, AppState>,
    note_id: String,
    destination: String,
) -> Result<(), String> {
    let dest_path = PathBuf::from(&destination);
    
    let file_service = state.file_service.lock().await;
    file_service
        .export_note(&note_id, &dest_path)
        .map_err(|e| format!("Failed to export note: {}", e))
}

#[tauri::command]
pub async fn get_note_content_for_export(
    state: State<'_, AppState>,
    note_id: String,
) -> Result<String, String> {
    let file_service = state.file_service.lock().await;
    file_service
        .read_note(&note_id)
        .map_err(|e| format!("Failed to read note: {}", e))
}
