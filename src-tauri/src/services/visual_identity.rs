use sha2::{Digest, Sha256};
use crate::models::visual_identity::VisualIdentitySeed;

/// Generate SHA-256 hash from note title and content
pub fn hash_note_content(title: &str, content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(title.as_bytes());
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Extract seed values from hash for deterministic generation
/// Returns 8 seed values (u32 each) extracted from the 32-byte hash
pub fn extract_seeds_from_hash(hash: &str) -> VisualIdentitySeed {
    // Parse hex string to bytes
    let hash_bytes: Vec<u8> = (0..hash.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&hash[i..i + 2], 16).unwrap_or(0))
        .collect();

    // Extract 8 seeds (4 bytes each = 32 bytes total)
    let mut seeds = Vec::new();
    for i in 0..8 {
        let start = i * 4;
        if start + 4 <= hash_bytes.len() {
            let seed = u32::from_be_bytes([
                hash_bytes[start],
                hash_bytes[start + 1],
                hash_bytes[start + 2],
                hash_bytes[start + 3],
            ]);
            seeds.push(seed);
        } else {
            seeds.push(0);
        }
    }

    VisualIdentitySeed {
        seeds,
        hash: hash.to_string(),
    }
}

/// Generate visual identity seed from note title and content
pub fn generate_visual_identity_seed(title: &str, content: &str) -> VisualIdentitySeed {
    let hash = hash_note_content(title, content);
    extract_seeds_from_hash(&hash)
}
