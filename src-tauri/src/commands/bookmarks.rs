use tauri::State;
use uuid::Uuid;

use crate::models::bookmark::{Bookmark, BookmarkMetadata};
use crate::state::AppState;

#[tauri::command]
pub async fn create_bookmark(
    state: State<'_, AppState>,
    url: String,
    title: String,
    description: Option<String>,
    tags: Option<String>,
    folder_id: Option<String>,
) -> Result<Bookmark, String> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();

    state
        .db
        .insert_bookmark(
            &id,
            &url,
            &title,
            description.as_deref(),
            tags.as_deref(),
            folder_id.as_deref(),
            now,
            now,
        )
        .map_err(|e| format!("Failed to create bookmark: {}", e))?;

    Ok(Bookmark {
        id,
        url,
        title,
        description,
        tags,
        folder_id,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub async fn get_bookmark(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<Bookmark>, String> {
    state
        .db
        .get_bookmark(&id)
        .map_err(|e| format!("Failed to get bookmark: {}", e))
}

#[tauri::command]
pub async fn list_bookmarks(
    state: State<'_, AppState>,
    folder_id: Option<String>,
) -> Result<Vec<BookmarkMetadata>, String> {
    state
        .db
        .list_bookmarks(folder_id.as_deref())
        .map_err(|e| format!("Failed to list bookmarks: {}", e))
}

#[tauri::command]
pub async fn update_bookmark(
    state: State<'_, AppState>,
    id: String,
    title: Option<String>,
    description: Option<String>,
    tags: Option<String>,
) -> Result<(), String> {
    let now = chrono::Utc::now().timestamp_millis();

    state
        .db
        .update_bookmark(
            &id,
            title.as_deref(),
            description.as_deref(),
            tags.as_deref(),
            now,
        )
        .map_err(|e| format!("Failed to update bookmark: {}", e))
}

#[tauri::command]
pub async fn delete_bookmark(state: State<'_, AppState>, id: String) -> Result<(), String> {
    state
        .db
        .delete_bookmark(&id)
        .map_err(|e| format!("Failed to delete bookmark: {}", e))
}
