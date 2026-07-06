use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::util::now_ms;
use crate::vault::DATA_DIR;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Bookmark {
    pub id: String,
    pub url: String,
    pub title: String,
    #[serde(default)]
    pub image: Option<String>,
    #[serde(default)]
    pub favicon: Option<String>,
    /// True once metadata fetch finished (successfully or not).
    #[serde(default)]
    pub meta_fetched: bool,
    pub created_at: i64,
}

fn store_path(root: &Path) -> std::path::PathBuf {
    root.join(DATA_DIR).join("bookmarks.json")
}

pub fn list(root: &Path) -> AppResult<Vec<Bookmark>> {
    let path = store_path(root);
    if !path.exists() {
        return Ok(Vec::new());
    }
    Ok(serde_json::from_str(&fs::read_to_string(path)?)?)
}

fn save(root: &Path, bookmarks: &[Bookmark]) -> AppResult<()> {
    fs::write(store_path(root), serde_json::to_string_pretty(bookmarks)?)?;
    Ok(())
}

fn normalize_url(input: &str) -> AppResult<String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(AppError::InvalidInput("url is empty".to_string()));
    }
    let with_scheme = if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        trimmed.to_string()
    } else {
        format!("https://{trimmed}")
    };
    Ok(with_scheme)
}

/// Human-readable placeholder title until metadata arrives: host + path.
fn placeholder_title(url: &str) -> String {
    url.trim_start_matches("https://")
        .trim_start_matches("http://")
        .trim_start_matches("www.")
        .trim_end_matches('/')
        .to_string()
}

pub fn add(root: &Path, url: &str) -> AppResult<Bookmark> {
    let url = normalize_url(url)?;
    let bookmark = Bookmark {
        id: Uuid::new_v4().to_string(),
        title: placeholder_title(&url),
        url,
        image: None,
        favicon: None,
        meta_fetched: false,
        created_at: now_ms(),
    };
    let mut bookmarks = list(root)?;
    bookmarks.insert(0, bookmark.clone());
    save(root, &bookmarks)?;
    Ok(bookmark)
}

pub fn update(
    root: &Path,
    id: &str,
    title: Option<String>,
    image: Option<String>,
    favicon: Option<String>,
    meta_fetched: Option<bool>,
) -> AppResult<Bookmark> {
    let mut bookmarks = list(root)?;
    let bookmark = bookmarks
        .iter_mut()
        .find(|b| b.id == id)
        .ok_or_else(|| AppError::NotFound(id.to_string()))?;
    if let Some(title) = title {
        let title = title.trim().to_string();
        if !title.is_empty() {
            bookmark.title = title;
        }
    }
    if image.is_some() {
        bookmark.image = image;
    }
    if favicon.is_some() {
        bookmark.favicon = favicon;
    }
    if let Some(fetched) = meta_fetched {
        bookmark.meta_fetched = fetched;
    }
    let updated = bookmark.clone();
    save(root, &bookmarks)?;
    Ok(updated)
}

pub fn delete(root: &Path, id: &str) -> AppResult<()> {
    let mut bookmarks = list(root)?;
    let before = bookmarks.len();
    bookmarks.retain(|b| b.id != id);
    if bookmarks.len() == before {
        return Err(AppError::NotFound(id.to_string()));
    }
    save(root, &bookmarks)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vault::ensure_layout;
    use tempfile::tempdir;

    #[test]
    fn add_normalizes_scheme() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        let b = add(dir.path(), "example.com/page").unwrap();
        assert_eq!(b.url, "https://example.com/page");
        assert_eq!(b.title, "example.com/page");
        assert!(!b.meta_fetched);
    }

    #[test]
    fn update_and_delete() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        let b = add(dir.path(), "https://example.com").unwrap();
        let updated = update(
            dir.path(),
            &b.id,
            Some("Example".to_string()),
            Some("https://example.com/og.png".to_string()),
            None,
            Some(true),
        )
        .unwrap();
        assert_eq!(updated.title, "Example");
        assert!(updated.meta_fetched);

        delete(dir.path(), &b.id).unwrap();
        assert!(list(dir.path()).unwrap().is_empty());
        assert!(delete(dir.path(), &b.id).is_err());
    }
}
