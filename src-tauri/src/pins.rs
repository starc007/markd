use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

use crate::error::{AppError, AppResult};
use crate::vault::{resolve_rel, DATA_DIR};

fn store_path(root: &Path) -> PathBuf {
    root.join(DATA_DIR).join("pins.json")
}

fn read(root: &Path) -> AppResult<Vec<String>> {
    let path = store_path(root);
    if !path.exists() {
        return Ok(Vec::new());
    }
    Ok(serde_json::from_str(&fs::read_to_string(path)?)?)
}

fn save(root: &Path, pins: &[String]) -> AppResult<()> {
    fs::write(store_path(root), serde_json::to_string_pretty(pins)?)?;
    Ok(())
}

fn is_entry(root: &Path, rel: &str) -> bool {
    resolve_rel(root, rel).is_ok_and(|path| {
        path.is_dir()
            || (path.is_file()
                && path
                    .extension()
                    .and_then(|extension| extension.to_str())
                    .is_some_and(|extension| extension.eq_ignore_ascii_case("md")))
    })
}

fn is_folder(root: &Path, rel: &str) -> bool {
    resolve_rel(root, rel).is_ok_and(|path| path.is_dir())
}

/// Return valid pins in saved order, pruning duplicates, missing entries, and
/// entries already represented by a pinned ancestor folder.
pub fn list(root: &Path) -> AppResult<Vec<String>> {
    let stored = read(root)?;
    let mut seen = HashSet::new();
    let mut pins: Vec<String> = stored
        .iter()
        .filter(|rel| seen.insert((*rel).clone()) && is_entry(root, rel))
        .cloned()
        .collect();
    let folders: Vec<String> = pins
        .iter()
        .filter(|rel| is_folder(root, rel))
        .cloned()
        .collect();
    pins.retain(|rel| {
        !folders
            .iter()
            .any(|folder| rel != folder && rel.starts_with(&format!("{folder}/")))
    });
    if pins != stored {
        save(root, &pins)?;
    }
    Ok(pins)
}

pub fn pin(root: &Path, rel: &str) -> AppResult<Vec<String>> {
    if !is_entry(root, rel) {
        return Err(AppError::NotFound(rel.to_string()));
    }
    let mut pins = list(root)?;
    if pins
        .iter()
        .any(|pin| is_folder(root, pin) && rel.starts_with(&format!("{pin}/")))
    {
        return Ok(pins);
    }
    if is_folder(root, rel) {
        pins.retain(|pin| !pin.starts_with(&format!("{rel}/")));
    }
    if !pins.iter().any(|pin| pin == rel) {
        pins.insert(0, rel.to_string());
        save(root, &pins)?;
    }
    Ok(pins)
}

pub fn unpin(root: &Path, rel: &str) -> AppResult<Vec<String>> {
    let mut pins = read(root)?;
    pins.retain(|pin| pin != rel);
    save(root, &pins)?;
    list(root)
}

/// Rewrite a pinned note or every pinned descendant after a note/folder move.
pub fn remap(root: &Path, from: &str, to: &str) -> AppResult<()> {
    let mut pins = read(root)?;
    let mut changed = false;
    for pin in &mut pins {
        if pin == from {
            *pin = to.to_string();
            changed = true;
        } else if pin.starts_with(&format!("{from}/")) {
            *pin = format!("{to}{}", &pin[from.len()..]);
            changed = true;
        }
    }
    if changed {
        save(root, &pins)?;
    }
    Ok(())
}

/// Remove a pinned note or every pinned descendant after deletion.
pub fn remove_under(root: &Path, rel: &str) -> AppResult<()> {
    let mut pins = read(root)?;
    let before = pins.len();
    pins.retain(|pin| pin != rel && !pin.starts_with(&format!("{rel}/")));
    if pins.len() != before {
        save(root, &pins)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vault::{ensure_layout, notes_root};
    use tempfile::tempdir;

    fn setup() -> tempfile::TempDir {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        fs::create_dir_all(notes_root(dir.path()).join("projects")).unwrap();
        fs::write(notes_root(dir.path()).join("Root.md"), "").unwrap();
        fs::write(notes_root(dir.path()).join("projects/Plan.md"), "").unwrap();
        dir
    }

    #[test]
    fn pins_once_and_unpins() {
        let dir = setup();
        assert_eq!(
            pin(dir.path(), "projects/Plan.md").unwrap(),
            ["projects/Plan.md"]
        );
        assert_eq!(
            pin(dir.path(), "projects/Plan.md").unwrap(),
            ["projects/Plan.md"]
        );
        assert!(unpin(dir.path(), "projects/Plan.md").unwrap().is_empty());
    }

    #[test]
    fn pins_folders_and_rejects_missing_entries() {
        let dir = setup();
        assert_eq!(pin(dir.path(), "projects").unwrap(), ["projects"]);
        assert!(pin(dir.path(), "Missing.md").is_err());
    }

    #[test]
    fn pinned_folder_replaces_and_contains_descendant_pins() {
        let dir = setup();
        pin(dir.path(), "projects/Plan.md").unwrap();
        assert_eq!(pin(dir.path(), "projects").unwrap(), ["projects"]);
        assert_eq!(pin(dir.path(), "projects/Plan.md").unwrap(), ["projects"]);
    }

    #[test]
    fn remaps_notes_and_folder_descendants() {
        let dir = setup();
        pin(dir.path(), "Root.md").unwrap();
        pin(dir.path(), "projects/Plan.md").unwrap();
        remap(dir.path(), "Root.md", "Home.md").unwrap();
        remap(dir.path(), "projects", "work").unwrap();
        assert_eq!(read(dir.path()).unwrap(), ["work/Plan.md", "Home.md"]);
    }

    #[test]
    fn prunes_missing_and_duplicate_entries() {
        let dir = setup();
        save(
            dir.path(),
            &[
                "Root.md".into(),
                "Root.md".into(),
                "Missing.md".into(),
                "../outside.md".into(),
            ],
        )
        .unwrap();
        assert_eq!(list(dir.path()).unwrap(), ["Root.md"]);
    }

    #[test]
    fn removes_deleted_folder_descendants() {
        let dir = setup();
        pin(dir.path(), "Root.md").unwrap();
        pin(dir.path(), "projects/Plan.md").unwrap();
        remove_under(dir.path(), "projects").unwrap();
        assert_eq!(list(dir.path()).unwrap(), ["Root.md"]);
    }
}
