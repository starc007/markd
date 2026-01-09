use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct PageLink {
    pub id: String,
    pub source_page_id: String,
    pub target_page_id: String,
    pub created_at: i64,
}

#[tauri::command]
pub async fn link_page(
    state: State<'_, AppState>,
    source_page_id: String,
    target_page_id: String,
) -> Result<(), String> {
    // Prevent self-linking
    if source_page_id == target_page_id {
        return Err("Cannot link page to itself".to_string());
    }

    // Verify both pages exist
    state
        .db
        .get_note_metadata(&source_page_id)
        .map_err(|e| format!("Failed to get source page: {}", e))?
        .ok_or_else(|| "Source page not found".to_string())?;

    state
        .db
        .get_note_metadata(&target_page_id)
        .map_err(|e| format!("Failed to get target page: {}", e))?
        .ok_or_else(|| "Target page not found".to_string())?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();

    state
        .db
        .create_page_link(&id, &source_page_id, &target_page_id, now)
        .map_err(|e| format!("Failed to create page link: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn unlink_page(
    state: State<'_, AppState>,
    source_page_id: String,
    target_page_id: String,
) -> Result<(), String> {
    state
        .db
        .delete_page_link(&source_page_id, &target_page_id)
        .map_err(|e| format!("Failed to unlink page: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_linked_pages(
    state: State<'_, AppState>,
    page_id: String,
) -> Result<Vec<String>, String> {
    state
        .db
        .get_linked_pages(&page_id)
        .map_err(|e| format!("Failed to get linked pages: {}", e))
}

#[tauri::command]
pub async fn get_backlinks(
    state: State<'_, AppState>,
    page_id: String,
) -> Result<Vec<String>, String> {
    state
        .db
        .get_backlinks(&page_id)
        .map_err(|e| format!("Failed to get backlinks: {}", e))
}

#[tauri::command]
pub async fn sync_page_links(
    state: State<'_, AppState>,
    page_id: String,
    linked_page_ids: Vec<String>,
) -> Result<(), String> {
    let now = Utc::now().timestamp_millis();
    state
        .db
        .sync_page_links(&page_id, &linked_page_ids, now)
        .map_err(|e| format!("Failed to sync page links: {}", e))?;

    Ok(())
}
