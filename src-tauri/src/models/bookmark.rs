use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bookmark {
    pub id: String,
    pub url: String,
    pub title: String,
    pub description: Option<String>,
    pub tags: Option<String>, // Comma-separated tags
    pub folder_id: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookmarkMetadata {
    pub id: String,
    pub url: String,
    pub title: String,
    pub description: Option<String>,
    pub tags: Option<String>,
    pub folder_id: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

impl From<Bookmark> for BookmarkMetadata {
    fn from(bookmark: Bookmark) -> Self {
        BookmarkMetadata {
            id: bookmark.id,
            url: bookmark.url,
            title: bookmark.title,
            description: bookmark.description,
            tags: bookmark.tags,
            folder_id: bookmark.folder_id,
            created_at: bookmark.created_at,
            updated_at: bookmark.updated_at,
        }
    }
}
