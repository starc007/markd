use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use crate::state::AppState;
use crate::models::sticky_note::{StickyNote, CreateStickyNoteParams, UpdateStickyNoteParams};

#[tauri::command]
pub async fn create_sticky_note(
    state: State<'_, AppState>,
    params: CreateStickyNoteParams,
) -> Result<StickyNote, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();
    let content = params.content.unwrap_or_default();
    let color_id = params.color_id.unwrap_or_else(|| "default".to_string());
    
    state.db
        .insert_sticky_note(&id, &content, &color_id, now, now)
        .map_err(|e| format!("Failed to create sticky note: {}", e))?;
    
    Ok(StickyNote {
        id,
        content,
        color_id,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub async fn get_sticky_note(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<StickyNote>, String> {
    state.db
        .get_sticky_note(&id)
        .map_err(|e| format!("Failed to get sticky note: {}", e))
}

#[tauri::command]
pub async fn update_sticky_note(
    state: State<'_, AppState>,
    params: UpdateStickyNoteParams,
) -> Result<StickyNote, String> {
    let now = Utc::now().timestamp_millis();
    
    state.db
        .update_sticky_note(
            &params.id,
            params.content.as_deref(),
            params.color_id.as_deref(),
            now,
        )
        .map_err(|e| format!("Failed to update sticky note: {}", e))?;
    
    state.db
        .get_sticky_note(&params.id)
        .map_err(|e| format!("Failed to get updated sticky note: {}", e))?
        .ok_or_else(|| "Sticky note not found after update".to_string())
}

#[tauri::command]
pub async fn delete_sticky_note(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    state.db
        .delete_sticky_note(&id)
        .map_err(|e| format!("Failed to delete sticky note: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn list_sticky_notes(
    state: State<'_, AppState>,
) -> Result<Vec<StickyNote>, String> {
    state.db
        .list_sticky_notes()
        .map_err(|e| format!("Failed to list sticky notes: {}", e))
}

