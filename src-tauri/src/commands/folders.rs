use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use crate::state::AppState;
use crate::models::folder::Folder;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFolderParams {
    pub name: String,
    pub parent_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateFolderParams {
    pub id: String,
    pub name: Option<String>,
    pub parent_id: Option<String>,
}

#[tauri::command]
pub async fn create_folder(
    state: State<'_, AppState>,
    params: CreateFolderParams,
) -> Result<Folder, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();
    
    state.db
        .insert_folder(&id, &params.name, params.parent_id.as_deref(), now)
        .map_err(|e| format!("Failed to create folder: {}", e))?;
    
    Ok(Folder {
        id,
        name: params.name,
        parent_id: params.parent_id,
        created_at: now,
    })
}

#[tauri::command]
pub async fn get_folder(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<Folder>, String> {
    state.db
        .get_folder(&id)
        .map_err(|e| format!("Failed to get folder: {}", e))
}

#[tauri::command]
pub async fn update_folder(
    state: State<'_, AppState>,
    params: UpdateFolderParams,
) -> Result<Folder, String> {
    state.db
        .update_folder(
            &params.id,
            params.name.as_deref(),
            params.parent_id.as_ref().map(|p| Some(p.as_str())),
        )
        .map_err(|e| format!("Failed to update folder: {}", e))?;
    
    state.db
        .get_folder(&params.id)
        .map_err(|e| format!("Failed to get updated folder: {}", e))?
        .ok_or_else(|| "Folder not found".to_string())
}

#[tauri::command]
pub async fn delete_folder(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    state.db
        .delete_folder(&id)
        .map_err(|e| format!("Failed to delete folder: {}", e))
}

#[tauri::command]
pub async fn list_folders(
    state: State<'_, AppState>,
) -> Result<Vec<Folder>, String> {
    state.db
        .list_folders()
        .map_err(|e| format!("Failed to list folders: {}", e))
}

#[tauri::command]
pub async fn move_note_to_folder(
    state: State<'_, AppState>,
    note_id: String,
    folder_id: Option<String>,
) -> Result<(), String> {
    let now = chrono::Utc::now().timestamp_millis();
    
    state.db
        .update_note_metadata(
            &note_id,
            None,
            Some(folder_id.as_deref()),
            now,
        )
        .map_err(|e| format!("Failed to move note: {}", e))
}
