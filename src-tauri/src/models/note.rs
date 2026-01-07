use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub file_path: String,
    pub folder_id: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteMetadata {
    pub id: String,
    pub title: String,
    pub preview: Option<String>,
    pub folder_id: Option<String>,
    pub pinned: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateNoteRequest {
    pub title: String,
    pub content: Option<String>,
    pub folder_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateNoteRequest {
    pub id: String,
    pub title: Option<String>,
    pub content: Option<String>,
    pub folder_id: Option<String>,
}

/// Extract a preview from markdown content
pub fn extract_preview(content: &str, max_length: usize) -> Option<String> {
    if content.trim().is_empty() {
        return None;
    }
    
    // Remove markdown syntax and get plain text preview
    let preview: String = content
        .lines()
        .filter(|line| !line.starts_with('#')) // Skip headings
        .flat_map(|line| {
            // Remove markdown formatting
            line.replace("**", "")
                .replace("__", "")
                .replace("*", "")
                .replace("_", "")
                .replace("`", "")
                .replace("> ", "")
                .replace("- ", "")
                .chars()
                .collect::<Vec<_>>()
        })
        .take(max_length + 50) // Take a bit more for processing
        .collect();
    
    let preview = preview.trim();
    
    if preview.is_empty() {
        return None;
    }
    
    // Truncate at word boundary
    if preview.len() > max_length {
        let truncated: String = preview.chars().take(max_length).collect();
        if let Some(last_space) = truncated.rfind(' ') {
            Some(format!("{}...", &truncated[..last_space]))
        } else {
            Some(format!("{}...", truncated))
        }
    } else {
        Some(preview.to_string())
    }
}
