use std::fs;
use std::path::Path;

use crate::error::{AppError, AppResult};
use crate::vault::{notes_root, resolve_rel};

const DAILY_FOLDER: &str = "Daily Notes";

/// Return today's daily note, creating the folder and file when needed.
/// `date` is supplied by the frontend so it follows the user's local timezone.
pub fn open_or_create(root: &Path, date: &str) -> AppResult<String> {
    if !is_iso_date(date) {
        return Err(AppError::InvalidInput(
            "invalid daily note date".to_string(),
        ));
    }

    let folder = notes_root(root).join(DAILY_FOLDER);
    if folder.exists() && !folder.is_dir() {
        return Err(AppError::InvalidInput(format!(
            "{DAILY_FOLDER} already exists as a note"
        )));
    }
    fs::create_dir_all(&folder)?;

    let rel = format!("{DAILY_FOLDER}/{date}.md");
    let path = resolve_rel(root, &rel)?;
    if path.exists() && !path.is_file() {
        return Err(AppError::InvalidInput(format!(
            "{date} already exists as a folder"
        )));
    }
    if !path.exists() {
        fs::write(&path, "")?;
    }
    Ok(rel)
}

fn is_iso_date(value: &str) -> bool {
    let bytes = value.as_bytes();
    bytes.len() == 10
        && bytes[4] == b'-'
        && bytes[7] == b'-'
        && bytes
            .iter()
            .enumerate()
            .all(|(index, byte)| index == 4 || index == 7 || byte.is_ascii_digit())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vault::ensure_layout;
    use tempfile::tempdir;

    #[test]
    fn creates_and_reuses_daily_note() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        let first = open_or_create(dir.path(), "2026-07-15").unwrap();
        fs::write(resolve_rel(dir.path(), &first).unwrap(), "today").unwrap();
        let second = open_or_create(dir.path(), "2026-07-15").unwrap();
        assert_eq!(first, second);
        assert_eq!(
            fs::read_to_string(resolve_rel(dir.path(), &second).unwrap()).unwrap(),
            "today"
        );
    }

    #[test]
    fn rejects_non_iso_dates() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        assert!(open_or_create(dir.path(), "15-07-2026").is_err());
    }
}
