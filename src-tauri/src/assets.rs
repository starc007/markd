use std::fs;
use std::path::{Path, PathBuf};

use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::vault::ASSETS_DIR;

const ALLOWED_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "gif", "webp", "svg"];

/// Save image bytes (sent from the editor as base64) into the vault's
/// asset folder. Returns the absolute path for use with the asset protocol.
pub fn save_image(root: &Path, base64_data: &str, extension: &str) -> AppResult<PathBuf> {
    let ext = extension.trim_start_matches('.').to_lowercase();
    if !ALLOWED_EXTENSIONS.contains(&ext.as_str()) {
        return Err(AppError::InvalidInput(format!(
            "unsupported image type: {ext}"
        )));
    }
    let bytes = decode_base64(base64_data)?;
    let dir = root.join(ASSETS_DIR);
    fs::create_dir_all(&dir)?;
    let path = dir.join(format!("{}.{ext}", Uuid::new_v4()));
    fs::write(&path, bytes)?;
    Ok(path)
}

fn decode_base64(data: &str) -> AppResult<Vec<u8>> {
    // Accept both raw base64 and data URLs.
    let raw = data.rsplit(',').next().unwrap_or(data);
    base64_decode(raw).ok_or_else(|| AppError::InvalidInput("invalid base64 image".to_string()))
}

/// Minimal base64 decoder (standard alphabet, ignores whitespace/padding).
fn base64_decode(input: &str) -> Option<Vec<u8>> {
    fn value(c: u8) -> Option<u32> {
        match c {
            b'A'..=b'Z' => Some((c - b'A') as u32),
            b'a'..=b'z' => Some((c - b'a' + 26) as u32),
            b'0'..=b'9' => Some((c - b'0' + 52) as u32),
            b'+' => Some(62),
            b'/' => Some(63),
            _ => None,
        }
    }
    let mut out = Vec::with_capacity(input.len() * 3 / 4);
    let mut buffer: u32 = 0;
    let mut bits = 0u8;
    for &byte in input.as_bytes() {
        if byte == b'=' || byte.is_ascii_whitespace() {
            continue;
        }
        buffer = (buffer << 6) | value(byte)?;
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            out.push((buffer >> bits) as u8);
        }
    }
    Some(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vault::ensure_layout;
    use tempfile::tempdir;

    #[test]
    fn saves_data_url_png() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        // 1x1 transparent png, truncated is fine for the write test
        let data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==";
        let path = save_image(dir.path(), data, "png").unwrap();
        assert!(path.exists());
        assert!(path.to_string_lossy().contains(".markd/assets"));
    }

    #[test]
    fn rejects_unknown_extension() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        assert!(save_image(dir.path(), "aGVsbG8=", "exe").is_err());
    }

    #[test]
    fn base64_roundtrip() {
        assert_eq!(base64_decode("aGVsbG8=").unwrap(), b"hello");
        assert!(base64_decode("!!!").is_none());
    }
}
