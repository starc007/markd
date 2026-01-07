use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;
use std::path::PathBuf;
use std::fs;

use crate::state::AppState;
use crate::models::note::{Note, NoteMetadata, extract_preview};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNoteParams {
    pub title: String,
    pub content: Option<String>,
    pub folder_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNoteParams {
    pub id: String,
    pub title: Option<String>,
    pub content: Option<String>,
    pub folder_id: Option<String>,
}

const PREVIEW_MAX_LENGTH: usize = 150;

#[tauri::command]
pub async fn create_note(
    state: State<'_, AppState>,
    params: CreateNoteParams,
) -> Result<Note, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();
    let content = params.content.unwrap_or_default();
    
    // Write content to file
    let file_service = state.file_service.lock().await;
    let file_path = file_service
        .write_note(&id, &content)
        .map_err(|e| format!("Failed to write note file: {}", e))?;
    
    let file_path_str = file_path.to_string_lossy().to_string();
    
    // Insert metadata into database
    state.db
        .insert_note_metadata(
            &id,
            &params.title,
            &file_path_str,
            params.folder_id.as_deref(),
            now,
            now,
        )
        .map_err(|e| format!("Failed to insert note metadata: {}", e))?;
    
    // Update preview
    let preview = extract_preview(&content, PREVIEW_MAX_LENGTH);
    state.db
        .update_note_preview(&id, preview.as_deref(), now)
        .map_err(|e| format!("Failed to update note preview: {}", e))?;
    
    // Index for search
    state.db
        .index_note(&id, &params.title, &content, "")
        .map_err(|e| format!("Failed to index note: {}", e))?;
    
    Ok(Note {
        id,
        title: params.title,
        content,
        file_path: file_path_str,
        folder_id: params.folder_id,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub async fn get_note(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<Note>, String> {
    // Get metadata
    let metadata = state.db
        .get_note_metadata(&id)
        .map_err(|e| format!("Failed to get note metadata: {}", e))?;
    
    match metadata {
        Some(meta) => {
            // Get file path and read content
            let file_path = state.db
                .get_note_file_path(&id)
                .map_err(|e| format!("Failed to get note file path: {}", e))?
                .ok_or_else(|| "Note file path not found".to_string())?;
            
            let file_service = state.file_service.lock().await;
            let content = file_service
                .read_note(&id)
                .map_err(|e| format!("Failed to read note content: {}", e))?;
            
            Ok(Some(Note {
                id: meta.id,
                title: meta.title,
                content,
                file_path,
                folder_id: meta.folder_id,
                created_at: meta.created_at,
                updated_at: meta.updated_at,
            }))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn update_note(
    state: State<'_, AppState>,
    params: UpdateNoteParams,
) -> Result<Note, String> {
    let now = Utc::now().timestamp_millis();
    
    // Get existing note
    let existing = state.db
        .get_note_metadata(&params.id)
        .map_err(|e| format!("Failed to get note: {}", e))?
        .ok_or_else(|| "Note not found".to_string())?;
    
    let title = params.title.clone().unwrap_or(existing.title.clone());
    let folder_id = params.folder_id.clone().or(existing.folder_id.clone());
    
    // Update content if provided
    let content = if let Some(new_content) = &params.content {
        let file_service = state.file_service.lock().await;
        file_service
            .write_note(&params.id, new_content)
            .map_err(|e| format!("Failed to write note content: {}", e))?;
        
        // Update preview
        let preview = extract_preview(new_content, PREVIEW_MAX_LENGTH);
        state.db
            .update_note_preview(&params.id, preview.as_deref(), now)
            .map_err(|e| format!("Failed to update note preview: {}", e))?;
        
        new_content.clone()
    } else {
        let file_service = state.file_service.lock().await;
        file_service
            .read_note(&params.id)
            .map_err(|e| format!("Failed to read note content: {}", e))?
    };
    
    // Update metadata
    state.db
        .update_note_metadata(
            &params.id,
            params.title.as_deref(),
            params.folder_id.as_ref().map(|f| Some(f.as_str())),
            now,
        )
        .map_err(|e| format!("Failed to update note metadata: {}", e))?;
    
    // Re-index for search
    state.db
        .index_note(&params.id, &title, &content, "")
        .map_err(|e| format!("Failed to re-index note: {}", e))?;
    
    let file_path = state.db
        .get_note_file_path(&params.id)
        .map_err(|e| format!("Failed to get note file path: {}", e))?
        .ok_or_else(|| "Note file path not found".to_string())?;
    
    Ok(Note {
        id: params.id,
        title,
        content,
        file_path,
        folder_id,
        created_at: existing.created_at,
        updated_at: now,
    })
}

#[tauri::command]
pub async fn delete_note(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    // Delete file
    let file_service = state.file_service.lock().await;
    file_service
        .delete_note(&id)
        .map_err(|e| format!("Failed to delete note file: {}", e))?;
    
    // Remove from search index
    state.db
        .remove_from_index(&id)
        .map_err(|e| format!("Failed to remove from search index: {}", e))?;
    
    // Delete metadata
    state.db
        .delete_note_metadata(&id)
        .map_err(|e| format!("Failed to delete note metadata: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn list_notes(
    state: State<'_, AppState>,
    folder_id: Option<String>,
) -> Result<Vec<NoteMetadata>, String> {
    state.db
        .list_notes(folder_id.as_deref())
        .map_err(|e| format!("Failed to list notes: {}", e))
}

#[tauri::command]
pub async fn save_note_content(
    state: State<'_, AppState>,
    id: String,
    content: String,
) -> Result<i64, String> {
    let now = Utc::now().timestamp_millis();
    
    // Write content to file
    let file_service = state.file_service.lock().await;
    file_service
        .write_note(&id, &content)
        .map_err(|e| format!("Failed to write note content: {}", e))?;
    
    // Update preview
    let preview = extract_preview(&content, PREVIEW_MAX_LENGTH);
    state.db
        .update_note_preview(&id, preview.as_deref(), now)
        .map_err(|e| format!("Failed to update note preview: {}", e))?;
    
    // Get title for re-indexing
    let meta = state.db
        .get_note_metadata(&id)
        .map_err(|e| format!("Failed to get note metadata: {}", e))?
        .ok_or_else(|| "Note not found".to_string())?;
    
    // Re-index for search
    state.db
        .index_note(&id, &meta.title, &content, "")
        .map_err(|e| format!("Failed to re-index note: {}", e))?;
    
    Ok(now)
}

#[tauri::command]
pub async fn import_file(
    state: State<'_, AppState>,
    file_path: String,
    folder_id: Option<String>,
) -> Result<Note, String> {
    let path = PathBuf::from(&file_path);
    
    // Check if file exists
    if !path.exists() {
        return Err("File does not exist".to_string());
    }
    
    // Read file content
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    // Extract title from filename (without extension)
    let title = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Imported Note")
        .to_string();
    
    // Create note with imported content
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();
    
    // Write content to note file
    let file_service = state.file_service.lock().await;
    let note_file_path = file_service
        .write_note(&id, &content)
        .map_err(|e| format!("Failed to write note file: {}", e))?;
    
    let note_file_path_str = note_file_path.to_string_lossy().to_string();
    
    // Insert metadata into database
    state.db
        .insert_note_metadata(
            &id,
            &title,
            &note_file_path_str,
            folder_id.as_deref(),
            now,
            now,
        )
        .map_err(|e| format!("Failed to insert note metadata: {}", e))?;
    
    // Update preview
    let preview = extract_preview(&content, PREVIEW_MAX_LENGTH);
    state.db
        .update_note_preview(&id, preview.as_deref(), now)
        .map_err(|e| format!("Failed to update note preview: {}", e))?;
    
    // Index for search
    state.db
        .index_note(&id, &title, &content, "")
        .map_err(|e| format!("Failed to index note: {}", e))?;
    
    Ok(Note {
        id,
        title,
        content,
        file_path: note_file_path_str,
        folder_id,
        created_at: now,
        updated_at: now,
    })
}
