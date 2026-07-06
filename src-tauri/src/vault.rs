use std::fs;
use std::path::{Component, Path, PathBuf};

use serde::Serialize;

use crate::error::{AppError, AppResult};

pub const NOTES_DIR: &str = "notes";
pub const DATA_DIR: &str = ".draft";
pub const ASSETS_DIR: &str = ".draft/assets";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TreeNode {
    /// File stem for notes, folder name for folders.
    pub name: String,
    /// Path relative to the notes root, e.g. "projects/app.md".
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

/// Create the expected vault layout inside `root`.
pub fn ensure_layout(root: &Path) -> AppResult<()> {
    if !root.is_dir() {
        return Err(AppError::VaultMissing(root.display().to_string()));
    }
    fs::create_dir_all(root.join(NOTES_DIR))?;
    fs::create_dir_all(root.join(ASSETS_DIR))?;
    Ok(())
}

pub fn notes_root(root: &Path) -> PathBuf {
    root.join(NOTES_DIR)
}

/// Resolve a relative path (from the notes root) to an absolute path,
/// rejecting traversal outside the notes tree.
pub fn resolve_rel(root: &Path, rel: &str) -> AppResult<PathBuf> {
    let rel_path = Path::new(rel);
    for component in rel_path.components() {
        match component {
            Component::Normal(_) => {}
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

/// Scan the notes tree into nested nodes. Folders first, then notes,
/// both alphabetical (case-insensitive).
pub fn scan_tree(root: &Path) -> AppResult<Vec<TreeNode>> {
    let notes = notes_root(root);
    if !notes.is_dir() {
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
        if is_hidden(&name) {
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
}
