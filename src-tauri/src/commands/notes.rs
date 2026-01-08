use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

use crate::models::note::{Note, NoteMetadata};
use crate::state::AppState;
use crate::utils::json_utils::{extract_plain_text, generate_preview};

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
const DEFAULT_CONTENT: &str = r#"{"type":"doc","content":[{"type":"paragraph"}]}"#;

#[tauri::command]
pub async fn create_note(
    state: State<'_, AppState>,
    params: CreateNoteParams,
) -> Result<Note, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();
    let content = params
        .content
        .unwrap_or_else(|| DEFAULT_CONTENT.to_string());

    // Generate preview from JSON
    let preview = generate_preview(&content, PREVIEW_MAX_LENGTH);

    // Insert note into database
    state
        .db
        .insert_note(
            &id,
            &params.title,
            &content,
            preview.as_deref(),
            params.folder_id.as_deref(),
            now,
            now,
        )
        .map_err(|e| format!("Failed to insert note: {}", e))?;

    // Extract plain text for search indexing
    let plain_text = extract_plain_text(&content);
    state
        .db
        .index_note(&id, &params.title, &plain_text, "")
        .map_err(|e| format!("Failed to index note: {}", e))?;

    Ok(Note {
        id,
        title: params.title,
        content,
        file_path: String::new(), // Deprecated, kept for compatibility
        folder_id: params.folder_id,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub async fn get_note(state: State<'_, AppState>, id: String) -> Result<Option<Note>, String> {
    // Get metadata
    let metadata = state
        .db
        .get_note_metadata(&id)
        .map_err(|e| format!("Failed to get note metadata: {}", e))?;

    match metadata {
        Some(meta) => {
            // Get content from database
            let content = state
                .db
                .get_note_content(&id)
                .map_err(|e| format!("Failed to get note content: {}", e))?
                .unwrap_or_else(|| DEFAULT_CONTENT.to_string());

            Ok(Some(Note {
                id: meta.id,
                title: meta.title,
                content,
                file_path: String::new(), // Deprecated
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
    let existing = state
        .db
        .get_note_metadata(&params.id)
        .map_err(|e| format!("Failed to get note: {}", e))?
        .ok_or_else(|| "Note not found".to_string())?;

    let title = params.title.clone().unwrap_or(existing.title.clone());
    let folder_id = params.folder_id.clone().or(existing.folder_id.clone());

    // Update content if provided
    let content = if let Some(new_content) = &params.content {
        // Generate preview
        let preview = generate_preview(new_content, PREVIEW_MAX_LENGTH);

        // Update content in database
        state
            .db
            .update_note_content(&params.id, new_content, preview.as_deref(), now)
            .map_err(|e| format!("Failed to update note content: {}", e))?;

        // Re-index for search with plain text
        let plain_text = extract_plain_text(new_content);
        state
            .db
            .index_note(&params.id, &title, &plain_text, "")
            .map_err(|e| format!("Failed to re-index note: {}", e))?;

        new_content.clone()
    } else {
        state
            .db
            .get_note_content(&params.id)
            .map_err(|e| format!("Failed to read note content: {}", e))?
            .unwrap_or_else(|| DEFAULT_CONTENT.to_string())
    };

    // Update metadata if title or folder changed
    if params.title.is_some() || params.folder_id.is_some() {
        state
            .db
            .update_note_metadata(
                &params.id,
                params.title.as_deref(),
                params.folder_id.as_ref().map(|f| Some(f.as_str())),
                now,
            )
            .map_err(|e| format!("Failed to update note metadata: {}", e))?;
    }

    Ok(Note {
        id: params.id,
        title,
        content,
        file_path: String::new(), // Deprecated
        folder_id,
        created_at: existing.created_at,
        updated_at: now,
    })
}

#[tauri::command]
pub async fn delete_note(state: State<'_, AppState>, id: String) -> Result<(), String> {
    // Remove from search index
    state
        .db
        .remove_from_index(&id)
        .map_err(|e| format!("Failed to remove from search index: {}", e))?;

    // Delete from database
    state
        .db
        .delete_note_metadata(&id)
        .map_err(|e| format!("Failed to delete note: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn list_notes(
    state: State<'_, AppState>,
    folder_id: Option<String>,
) -> Result<Vec<NoteMetadata>, String> {
    state
        .db
        .list_notes(folder_id.as_deref())
        .map_err(|e| format!("Failed to list notes: {}", e))
}

#[tauri::command]
pub async fn toggle_note_pinned(
    state: State<'_, AppState>,
    id: String,
    pinned: bool,
) -> Result<(), String> {
    let now = Utc::now().timestamp_millis();
    state
        .db
        .toggle_note_pinned(&id, pinned, now)
        .map_err(|e| format!("Failed to toggle note pinned status: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn save_note_content(
    state: State<'_, AppState>,
    id: String,
    content: String,
) -> Result<i64, String> {
    let now = Utc::now().timestamp_millis();

    // Generate preview from JSON
    let preview = generate_preview(&content, PREVIEW_MAX_LENGTH);

    // Update content in database
    state
        .db
        .update_note_content(&id, &content, preview.as_deref(), now)
        .map_err(|e| format!("Failed to update note content: {}", e))?;

    // Get title for re-indexing
    let meta = state
        .db
        .get_note_metadata(&id)
        .map_err(|e| format!("Failed to get note metadata: {}", e))?
        .ok_or_else(|| "Note not found".to_string())?;

    // Re-index for search with plain text
    let plain_text = extract_plain_text(&content);
    state
        .db
        .index_note(&id, &meta.title, &plain_text, "")
        .map_err(|e| format!("Failed to re-index note: {}", e))?;

    Ok(now)
}

#[tauri::command]
pub async fn import_file(
    state: State<'_, AppState>,
    file_path: String,
    folder_id: Option<String>,
) -> Result<Note, String> {
    use std::fs;
    use std::path::PathBuf;

    let path = PathBuf::from(&file_path);

    // Check if file exists
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    // Read markdown file content
    let markdown_content =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;

    // Extract title from filename (without extension)
    let title = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Imported Note")
        .to_string();

    // Convert markdown to Tiptap JSON (we'll do this on the frontend for now)
    // For now, store markdown as-is and let frontend handle conversion
    let json_content = serde_json::json!({
        "type": "doc",
        "content": [{
            "type": "paragraph",
            "content": [{
                "type": "text",
                "text": markdown_content
            }]
        }]
    })
    .to_string();

    // Create note
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();

    // Generate preview
    let preview = generate_preview(&json_content, PREVIEW_MAX_LENGTH);

    // Insert into database
    state
        .db
        .insert_note(
            &id,
            &title,
            &json_content,
            preview.as_deref(),
            folder_id.as_deref(),
            now,
            now,
        )
        .map_err(|e| format!("Failed to insert note: {}", e))?;

    // Index for search
    let plain_text = extract_plain_text(&json_content);
    state
        .db
        .index_note(&id, &title, &plain_text, "")
        .map_err(|e| format!("Failed to index note: {}", e))?;

    Ok(Note {
        id,
        title,
        content: json_content,
        file_path: String::new(),
        folder_id,
        created_at: now,
        updated_at: now,
    })
}
