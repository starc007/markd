use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteVisualIdentity {
    pub note_id: String,
    pub gradient_colors: Vec<String>, // Array of hex colors
    pub pattern_type: String, // "mesh" | "voronoi" | "waves" | "sacred" | "particles"
    pub pattern_data: Option<String>, // JSON string with pattern-specific parameters
    pub image_data: Option<String>, // Base64 encoded canvas image
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisualIdentitySeed {
    pub seeds: Vec<u32>, // 8 seed values extracted from hash
    pub hash: String, // Original hash for reference
}
