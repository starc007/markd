use std::collections::HashSet;
use std::ffi::OsStr;
use std::fs;
use std::path::{Component, Path, PathBuf};

use serde::Serialize;

use crate::error::{AppError, AppResult};

pub const DATA_DIR: &str = ".markd";
pub const ASSETS_DIR: &str = ".markd/assets";
const ROOT_LAYOUT_MARKER: &str = ".markd/root-notes-layout";
const LEGACY_MIGRATION_DIR: &str = ".markd/legacy-notes-layout";
const LEGACY_NOTES_DIR: &str = "notes";
const RESERVED_ROOT_FILES: [&str; 2] = ["AGENTS.md", "CLAUDE.md"];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TreeNode {
    /// File stem for notes, folder name for folders.
    pub name: String,
    /// Path relative to the vault root, e.g. "projects/app.md".
    pub rel: String,
    pub kind: NodeKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<TreeNode>>,
    pub modified_ms: i64,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum NodeKind {
    Folder,
    Note,
}

#[derive(Debug, Clone, PartialEq)]
pub struct LayoutMigration {
    pub from: String,
    pub to: String,
}

/// Create the expected vault layout inside `root`.
pub fn ensure_layout(root: &Path) -> AppResult<Vec<LayoutMigration>> {
    if !root.is_dir() {
        return Err(AppError::VaultMissing(root.display().to_string()));
    }
    let existing_vault = root.join(DATA_DIR).is_dir();
    fs::create_dir_all(root.join(ASSETS_DIR))?;
    let migrations = if existing_vault && !root.join(ROOT_LAYOUT_MARKER).exists() {
        migrate_legacy_notes(root)?
    } else {
        Vec::new()
    };
    fs::write(root.join(ROOT_LAYOUT_MARKER), "1\n")?;
    Ok(migrations)
}

pub fn notes_root(root: &Path) -> PathBuf {
    root.to_path_buf()
}

/// Resolve a vault-relative note path while rejecting traversal and Markd's
/// reserved root data.
pub fn resolve_rel(root: &Path, rel: &str) -> AppResult<PathBuf> {
    let rel_path = Path::new(rel);
    let mut first = true;
    for component in rel_path.components() {
        match component {
            Component::Normal(name) => {
                if name.to_string_lossy().starts_with('.')
                    || (first && is_reserved_root_name(name))
                {
                    return Err(AppError::InvalidPath(rel.to_string()));
                }
                first = false;
            }
            Component::CurDir => {}
            _ => return Err(AppError::InvalidPath(rel.to_string())),
        }
    }
    Ok(notes_root(root).join(rel_path))
}

pub fn rel_of(root: &Path, path: &Path) -> AppResult<String> {
    path.strip_prefix(notes_root(root))
        .map(|p| p.to_string_lossy().replace('\\', "/"))
        .map_err(|_| AppError::InvalidPath(path.display().to_string()))
}

fn modified_ms(path: &Path) -> i64 {
    fs::metadata(path)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

fn is_hidden(name: &str) -> bool {
    name.starts_with('.')
}

fn is_reserved_root_name(name: &OsStr) -> bool {
    RESERVED_ROOT_FILES.iter().any(|reserved| name == *reserved)
}

pub fn is_reserved_note_path(root: &Path, path: &Path) -> bool {
    path.parent() == Some(root)
        && path.file_name().is_some_and(is_reserved_root_name)
}

fn migrate_legacy_notes(root: &Path) -> AppResult<Vec<LayoutMigration>> {
    let legacy = root.join(LEGACY_NOTES_DIR);
    let staging = root.join(LEGACY_MIGRATION_DIR);
    if legacy.exists() && staging.exists() {
        return Err(AppError::InvalidInput(
            "both the legacy notes folder and its migration folder exist".to_string(),
        ));
    }
    let source = if staging.is_dir() {
        staging.clone()
    } else if legacy.is_dir() {
        legacy.clone()
    } else {
        return Ok(Vec::new());
    };

    remove_disposable_metadata(&source)?;
    if source == legacy {
        fs::rename(&legacy, &staging)?;
    }
    let mut entries = fs::read_dir(&staging)?.collect::<Result<Vec<_>, _>>()?;
    entries.sort_by_key(|entry| entry.file_name());
    let original_names = entries
        .iter()
        .map(|entry| entry.file_name().to_string_lossy().to_string())
        .collect::<HashSet<_>>();
    let mut migrations = Vec::new();
    for entry in entries {
        let from = entry.file_name().to_string_lossy().to_string();
        let target = available_migration_target(root, &entry.path(), &from, &original_names);
        let to = target
            .file_name()
            .map(|name| name.to_string_lossy().to_string())
            .ok_or_else(|| AppError::InvalidPath(target.display().to_string()))?;
        fs::rename(entry.path(), &target)?;
        if from != to {
            migrations.push(LayoutMigration { from, to });
        }
    }
    fs::remove_dir(&staging)?;
    Ok(migrations)
}

fn available_migration_target(
    root: &Path,
    source: &Path,
    original: &str,
    original_names: &HashSet<String>,
) -> PathBuf {
    let direct = root.join(original);
    if !direct.exists() {
        return direct;
    }
    let original_path = Path::new(original);
    let stem = original_path
        .file_stem()
        .map(|value| value.to_string_lossy().to_string())
        .unwrap_or_else(|| original.to_string());
    let extension = (!source.is_dir())
        .then(|| original_path.extension())
        .flatten()
        .map(|value| value.to_string_lossy().to_string());
    let mut counter = 2;
    loop {
        let name = match &extension {
            Some(extension) => format!("{stem} {counter}.{extension}"),
            None => format!("{stem} {counter}"),
        };
        let candidate = root.join(&name);
        if !candidate.exists() && !original_names.contains(&name) {
            return candidate;
        }
        counter += 1;
    }
}

fn remove_disposable_metadata(dir: &Path) -> AppResult<()> {
    let finder_metadata = dir.join(".DS_Store");
    if finder_metadata.is_file() {
        fs::remove_file(finder_metadata)?;
    }
    Ok(())
}

/// Scan the notes tree into nested nodes. Folders first, then notes,
/// both alphabetical (case-insensitive).
pub fn scan_tree(root: &Path) -> AppResult<Vec<TreeNode>> {
    let notes = notes_root(root);
    if !root.is_dir() {
        return Err(AppError::VaultMissing(root.display().to_string()));
    }
    scan_dir(root, &notes)
}

fn scan_dir(root: &Path, dir: &Path) -> AppResult<Vec<TreeNode>> {
    let mut folders: Vec<TreeNode> = Vec::new();
    let mut notes: Vec<TreeNode> = Vec::new();

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if is_hidden(&name) || is_reserved_note_path(root, &path) {
            continue;
        }
        if path.is_dir() {
            folders.push(TreeNode {
                name: name.clone(),
                rel: rel_of(root, &path)?,
                kind: NodeKind::Folder,
                children: Some(scan_dir(root, &path)?),
                modified_ms: modified_ms(&path),
            });
        } else if path.extension().is_some_and(|e| e == "md") {
            let stem = path
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or(name);
            notes.push(TreeNode {
                name: stem,
                rel: rel_of(root, &path)?,
                kind: NodeKind::Note,
                children: None,
                modified_ms: modified_ms(&path),
            });
        }
    }

    let sort_key = |node: &TreeNode| node.name.to_lowercase();
    folders.sort_by_key(sort_key);
    notes.sort_by_key(sort_key);
    folders.extend(notes);
    Ok(folders)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn layout_and_scan() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        let notes = notes_root(dir.path());
        assert_eq!(notes, dir.path());
        assert!(!dir.path().join(LEGACY_NOTES_DIR).exists());
        fs::create_dir_all(notes.join("b-folder")).unwrap();
        fs::write(notes.join("a note.md"), "hello").unwrap();
        fs::write(notes.join("b-folder/nested.md"), "hi").unwrap();
        fs::write(notes.join("ignored.txt"), "no").unwrap();

        let tree = scan_tree(dir.path()).unwrap();
        assert_eq!(tree.len(), 2);
        assert_eq!(tree[0].name, "b-folder");
        assert_eq!(tree[0].kind, NodeKind::Folder);
        assert_eq!(tree[0].children.as_ref().unwrap()[0].rel, "b-folder/nested.md");
        assert_eq!(tree[1].name, "a note");
    }

    #[test]
    fn rejects_traversal() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        assert!(resolve_rel(dir.path(), "../escape.md").is_err());
        assert!(resolve_rel(dir.path(), "/abs.md").is_err());
        assert!(resolve_rel(dir.path(), "ok/fine.md").is_ok());
    }

    #[test]
    fn hidden_entries_skipped() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        let notes = notes_root(dir.path());
        fs::create_dir_all(notes.join(".hidden")).unwrap();
        fs::write(notes.join(".secret.md"), "x").unwrap();
        assert!(scan_tree(dir.path()).unwrap().is_empty());
    }

    #[test]
    fn migrates_an_existing_markd_vault_to_the_root() {
        let dir = tempdir().unwrap();
        fs::create_dir_all(dir.path().join(ASSETS_DIR)).unwrap();
        fs::create_dir_all(dir.path().join("notes/projects")).unwrap();
        fs::write(dir.path().join("notes/Root.md"), "root").unwrap();
        fs::write(dir.path().join("notes/projects/Plan.md"), "plan").unwrap();

        ensure_layout(dir.path()).unwrap();

        assert_eq!(
            fs::read_to_string(dir.path().join("Root.md")).unwrap(),
            "root"
        );
        assert_eq!(
            fs::read_to_string(dir.path().join("projects/Plan.md")).unwrap(),
            "plan"
        );
        assert!(!dir.path().join("notes").exists());
    }

    #[test]
    fn keeps_a_notes_folder_in_a_new_root_layout() {
        let dir = tempdir().unwrap();
        fs::create_dir_all(dir.path().join("notes")).unwrap();
        fs::write(dir.path().join("notes/Nested.md"), "nested").unwrap();

        ensure_layout(dir.path()).unwrap();

        assert!(dir.path().join("notes/Nested.md").is_file());
    }

    #[test]
    fn suffixes_legacy_items_when_root_names_collide() {
        let dir = tempdir().unwrap();
        fs::create_dir_all(dir.path().join(ASSETS_DIR)).unwrap();
        fs::create_dir_all(dir.path().join("notes")).unwrap();
        fs::write(dir.path().join("notes/Plan.md"), "legacy").unwrap();
        fs::write(dir.path().join("notes/Plan 2.md"), "legacy second").unwrap();
        fs::write(dir.path().join("Plan.md"), "root").unwrap();

        let migrations = ensure_layout(dir.path()).unwrap();

        assert_eq!(fs::read_to_string(dir.path().join("Plan.md")).unwrap(), "root");
        assert_eq!(
            fs::read_to_string(dir.path().join("Plan 3.md")).unwrap(),
            "legacy"
        );
        assert_eq!(
            fs::read_to_string(dir.path().join("Plan 2.md")).unwrap(),
            "legacy second"
        );
        assert_eq!(
            migrations,
            [LayoutMigration {
                from: "Plan.md".to_string(),
                to: "Plan 3.md".to_string(),
            }]
        );
        assert!(!dir.path().join("notes").exists());
    }

    #[test]
    fn finder_metadata_does_not_block_legacy_migration() {
        let dir = tempdir().unwrap();
        fs::create_dir_all(dir.path().join(ASSETS_DIR)).unwrap();
        fs::create_dir_all(dir.path().join("notes")).unwrap();
        fs::write(dir.path().join(".DS_Store"), "root metadata").unwrap();
        fs::write(dir.path().join("notes/.DS_Store"), "legacy metadata").unwrap();
        fs::write(dir.path().join("notes/Plan.md"), "plan").unwrap();

        ensure_layout(dir.path()).unwrap();

        assert_eq!(fs::read_to_string(dir.path().join("Plan.md")).unwrap(), "plan");
        assert_eq!(
            fs::read_to_string(dir.path().join(".DS_Store")).unwrap(),
            "root metadata"
        );
        assert!(!dir.path().join("notes").exists());
    }

    #[test]
    fn reserved_root_files_are_not_notes() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        fs::write(dir.path().join("AGENTS.md"), "guide").unwrap();
        fs::write(dir.path().join("Note.md"), "note").unwrap();

        let tree = scan_tree(dir.path()).unwrap();
        assert_eq!(tree.len(), 1);
        assert_eq!(tree[0].rel, "Note.md");
        assert!(resolve_rel(dir.path(), "AGENTS.md").is_err());
        assert!(resolve_rel(dir.path(), ".markd/todos.json").is_err());
    }
}
