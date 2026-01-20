use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

use crate::models::note::{Note, NoteMetadata};
use crate::state::AppState;
use crate::utils::json_utils::{extract_plain_text, generate_preview};
use crate::utils::validation::validate_tiptap_json;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNoteParams {
    pub title: String,
    pub content: Option<String>,
    pub folder_id: Option<String>,
    pub parent_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNoteParams {
    pub id: String,
    pub title: Option<String>,
    pub content: Option<String>,
    pub folder_id: Option<String>,
    pub banner_type: Option<String>,
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

    // Validate TipTap JSON structure
    validate_tiptap_json(&content).map_err(|e| format!("Invalid note content: {}", e))?;

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
            params.parent_id.as_deref(),
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
        parent_id: params.parent_id,
        banner_type: None, // New notes don't have a banner by default
        deleted_at: None, // New notes are not deleted
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

            // Get banner_type from database
            let banner_type = state.db.get_note_banner_type(&id).ok().flatten();

            Ok(Some(Note {
                id: meta.id,
                title: meta.title,
                content,
                file_path: String::new(), // Deprecated
                folder_id: meta.folder_id,
                parent_id: meta.parent_id,
                banner_type,
                deleted_at: meta.deleted_at,
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
        // Validate TipTap JSON structure
        validate_tiptap_json(new_content).map_err(|e| format!("Invalid note content: {}", e))?;

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


    if params.title.is_some() || params.folder_id.is_some() || true {
        state
            .db
            .update_note_metadata(
                &params.id,
                params.title.as_deref(),
                params.folder_id.as_ref().map(|f| Some(f.as_str())),
                // Always pass banner_type (even if None) - this allows setting to NULL in DB
                Some(params.banner_type.as_ref().map(|b| b.as_str())),
                now,
            )
            .map_err(|e| format!("Failed to update note metadata: {}", e))?;
    }

    // Get banner_type from database
    let banner_type = state.db.get_note_banner_type(&params.id).ok().flatten();

    Ok(Note {
        id: params.id,
        title,
        content,
        file_path: String::new(), // Deprecated
        folder_id,
        parent_id: existing.parent_id,
        banner_type,
        deleted_at: existing.deleted_at, // Preserve deleted_at status
        created_at: existing.created_at,
        updated_at: now,
    })
}

#[tauri::command]
pub async fn delete_note(state: State<'_, AppState>, id: String) -> Result<(), String> {
    // Soft delete (move to trash)
    state
        .db
        .soft_delete_note_metadata(&id)
        .map_err(|e| format!("Failed to delete note: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn list_notes(
    state: State<'_, AppState>,
    folder_id: Option<String>,
    parent_id: Option<String>,
) -> Result<Vec<NoteMetadata>, String> {
    let result = state
        .db
        .list_notes(folder_id.as_deref(), parent_id.as_deref())
        .map_err(|e| format!("Failed to list notes: {}", e));

    result
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
    // Queue the save operation - it will be processed in the background
    // with deduplication and batching
    state.save_queue.queue_save(id, content).await?;

    // Return current timestamp immediately
    // The actual save happens asynchronously in the queue
    Ok(Utc::now().timestamp_millis())
}

/// Flush all pending saves immediately
/// Call this before app shutdown or when window loses focus to ensure no data is lost
#[tauri::command]
pub async fn flush_pending_saves(state: State<'_, AppState>) -> Result<(), String> {
    state.save_queue.flush_now().await
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
            None, // Imported files are top-level
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
        parent_id: None, // Imported files are top-level
        banner_type: None,
        deleted_at: None, // Imported notes are not deleted
        created_at: now,
        updated_at: now,
    })
}

// Page hierarchy commands
#[tauri::command]
pub async fn create_subpage(
    state: State<'_, AppState>,
    parent_id: String,
    title: String,
) -> Result<Note, String> {
    // Verify parent exists
    let parent = state
        .db
        .get_note_metadata(&parent_id)
        .map_err(|e| format!("Failed to get parent: {}", e))?
        .ok_or_else(|| "Parent page not found".to_string())?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();
    let content = DEFAULT_CONTENT.to_string();

    // Generate preview
    let preview = generate_preview(&content, PREVIEW_MAX_LENGTH);

    // Insert subpage
    state
        .db
        .insert_note(
            &id,
            &title,
            &content,
            preview.as_deref(),
            parent.folder_id.as_deref(),
            Some(&parent_id),
            now,
            now,
        )
        .map_err(|e| format!("Failed to create subpage: {}", e))?;

    // Index for search
    let plain_text = extract_plain_text(&content);
    state
        .db
        .index_note(&id, &title, &plain_text, "")
        .map_err(|e| format!("Failed to index subpage: {}", e))?;

    Ok(Note {
        id,
        title,
        content,
        file_path: String::new(),
        folder_id: parent.folder_id,
        parent_id: Some(parent_id),
        banner_type: None,
        deleted_at: None, // New subpages are not deleted
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub async fn get_page_children(
    state: State<'_, AppState>,
    parent_id: String,
) -> Result<Vec<NoteMetadata>, String> {
    state
        .db
        .get_page_children(&parent_id)
        .map_err(|e| format!("Failed to get page children: {}", e))
}

#[tauri::command]
pub async fn move_page(
    state: State<'_, AppState>,
    page_id: String,
    new_parent_id: Option<String>,
) -> Result<(), String> {
    // Check for circular reference
    if let Some(ref parent_id) = new_parent_id {
        if state
            .db
            .would_create_circular_reference(&page_id, parent_id)
            .map_err(|e| format!("Failed to check circular reference: {}", e))?
        {
            return Err("Cannot move page: would create circular reference".to_string());
        }
    }

    let now = Utc::now().timestamp_millis();
    state
        .db
        .update_note_parent(&page_id, new_parent_id.as_deref(), now)
        .map_err(|e| format!("Failed to move page: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn restore_note(
    state: State<'_, AppState>,
    id: String,
) -> Result<Note, String> {
    // Restore note from trash
    state
        .db
        .restore_note(&id)
        .map_err(|e| format!("Failed to restore note: {}", e))?;

    // Get the restored note
    let metadata = state
        .db
        .get_note_metadata(&id)
        .map_err(|e| format!("Failed to get restored note: {}", e))?
        .ok_or_else(|| "Note not found after restore".to_string())?;

    let content = state
        .db
        .get_note_content(&id)
        .map_err(|e| format!("Failed to get note content: {}", e))?
        .unwrap_or_else(|| DEFAULT_CONTENT.to_string());

    let banner_type = state.db.get_note_banner_type(&id).ok().flatten();

    Ok(Note {
        id: metadata.id,
        title: metadata.title,
        content,
        file_path: String::new(),
        folder_id: metadata.folder_id,
        parent_id: metadata.parent_id,
        banner_type,
        deleted_at: None, // Restored notes have deleted_at = NULL
        created_at: metadata.created_at,
        updated_at: metadata.updated_at,
    })
}

#[tauri::command]
pub async fn permanently_delete_note(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    // Permanently delete note from database
    state
        .db
        .permanently_delete_note_metadata(&id)
        .map_err(|e| format!("Failed to permanently delete note: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn list_trashed_notes(
    state: State<'_, AppState>,
) -> Result<Vec<NoteMetadata>, String> {
    state
        .db
        .list_trashed_notes()
        .map_err(|e| format!("Failed to list trashed notes: {}", e))
}

#[tauri::command]
pub async fn cleanup_expired_trash(
    state: State<'_, AppState>,
) -> Result<u32, String> {
    state
        .db
        .cleanup_expired_trash()
        .map_err(|e| format!("Failed to cleanup expired trash: {}", e))
}

/// Save custom banner image for a note
/// imageData: Base64-encoded data URL (e.g., "data:image/png;base64,...")
#[tauri::command]
pub async fn save_banner_image(
    state: State<'_, AppState>,
    note_id: String,
    image_data: String,
) -> Result<String, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();
    state
        .db
        .save_banner_image(&id, &note_id, &image_data, now)
        .map_err(|e| format!("Failed to save banner image: {}", e))?;
    Ok(id)
}

/// Get custom banner image for a note
/// Returns base64 data URL or None if no custom image exists
#[tauri::command]
pub async fn get_banner_image(
    state: State<'_, AppState>,
    note_id: String,
) -> Result<Option<String>, String> {
    state
        .db
        .get_banner_image(&note_id)
        .map_err(|e| format!("Failed to get banner image: {}", e))
}

/// Delete custom banner image for a note
#[tauri::command]
pub async fn delete_banner_image(
    state: State<'_, AppState>,
    note_id: String,
) -> Result<(), String> {
    state
        .db
        .delete_banner_image(&note_id)
        .map_err(|e| format!("Failed to delete banner image: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_tiptap_json() {
        // Valid TipTap JSON
        let valid = r#"{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}"#;
        assert!(validate_tiptap_json(valid).is_ok());

        // Valid - empty content
        let valid_empty = r#"{"type":"doc","content":[]}"#;
        assert!(validate_tiptap_json(valid_empty).is_ok());

        // Invalid - missing type
        let invalid1 = r#"{"content":[]}"#;
        assert!(validate_tiptap_json(invalid1).is_err());

        // Invalid - wrong root type
        let invalid2 = r#"{"type":"paragraph","content":[]}"#;
        assert!(validate_tiptap_json(invalid2).is_err());

        // Invalid - not JSON
        let invalid3 = "not json";
        assert!(validate_tiptap_json(invalid3).is_err());

        // Invalid - missing content
        let invalid4 = r#"{"type":"doc"}"#;
        assert!(validate_tiptap_json(invalid4).is_err());
    }
}
