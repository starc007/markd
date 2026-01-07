use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StickyNote {
    pub id: String,
    pub content: String,
    pub color_id: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateStickyNoteParams {
    pub content: Option<String>,
    pub color_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateStickyNoteParams {
    pub id: String,
    pub content: Option<String>,
    pub color_id: Option<String>,
}

