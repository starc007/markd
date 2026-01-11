use tauri::State;
use uuid::Uuid;

use crate::models::bookmark::{Bookmark, BookmarkMetadata};
use crate::services::url_metadata::fetch_url_metadata;
use crate::state::AppState;

#[tauri::command]
pub async fn create_bookmark(
    state: State<'_, AppState>,
    url: String,
    title: Option<String>,
    tags: Option<String>,
    folder_id: Option<String>,
) -> Result<Bookmark, String> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();

    // Fetch metadata (title and favicon) from URL - don't fail if this errors
    let (final_title, favicon) = match fetch_url_metadata(&url).await {
        Ok(metadata) => {
            // Use provided title if given, otherwise use fetched title, fallback to URL hostname
            let title_to_use = title.or(metadata.title).unwrap_or_else(|| {
                url::Url::parse(&url)
                    .ok()
                    .and_then(|u| u.host_str().map(|h| h.replace("www.", "")))
                    .unwrap_or_else(|| "Bookmark".to_string())
            });
            (title_to_use, metadata.favicon)
        }
        Err(e) => {
            eprintln!("Failed to fetch URL metadata: {}", e);
            // Fallback: use provided title or extract from URL
            let fallback_title = title.unwrap_or_else(|| {
                url::Url::parse(&url)
                    .ok()
                    .and_then(|u| u.host_str().map(|h| h.replace("www.", "")))
                    .unwrap_or_else(|| "Bookmark".to_string())
            });
            (fallback_title, None)
        }
    };

    state
        .db
        .insert_bookmark(
            &id,
            &url,
            &final_title,
            tags.as_deref(),
            folder_id.as_deref(),
            favicon.as_deref(),
            now,
            now,
        )
        .map_err(|e| format!("Failed to create bookmark: {}", e))?;

    Ok(Bookmark {
        id,
        url,
        title: final_title,
        tags,
        folder_id,
        favicon,
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
    url: Option<String>,
    title: Option<String>,
    tags: Option<String>,
) -> Result<(), String> {
    let now = chrono::Utc::now().timestamp_millis();

    state
        .db
        .update_bookmark(&id, url.as_deref(), title.as_deref(), tags.as_deref(), now)
        .map_err(|e| format!("Failed to update bookmark: {}", e))
}

#[tauri::command]
pub async fn delete_bookmark(state: State<'_, AppState>, id: String) -> Result<(), String> {
    state
        .db
        .delete_bookmark(&id)
        .map_err(|e| format!("Failed to delete bookmark: {}", e))
}

#[derive(serde::Serialize)]
pub struct UrlMetadataResult {
    title: Option<String>,
    favicon: Option<String>,
}

#[tauri::command]
pub async fn fetch_bookmark_metadata(url: String) -> Result<UrlMetadataResult, String> {
    match fetch_url_metadata(&url).await {
        Ok(metadata) => Ok(UrlMetadataResult {
            title: metadata.title,
            favicon: metadata.favicon,
        }),
        Err(e) => Err(format!("Failed to fetch metadata: {}", e)),
    }
}
