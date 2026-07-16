use std::fs;
use std::path::{Path, PathBuf};

use crate::error::{AppError, AppResult};
use crate::util::sanitize_name;
use crate::vault::{notes_root, rel_of, resolve_rel};
use crate::{backlinks, pins};

const WELCOME: &str = r#"# Welcome to Markd

A fast, local-first place to write. Every note here is a plain `.md` file in the
folder you picked. Open it in your file manager, sync it your way, or version it with git.
Delete this note whenever you like.

## Try these

- [ ] Press **Ctrl/Cmd+K** to jump to any note or run a command
- [ ] Press **Ctrl/Cmd+N** to create a new note
- [ ] Type `[[` to link to another note
- [ ] Press **Ctrl/Cmd+Shift+D** to toggle light / dark
- [ ] Drag notes and folders in the sidebar to organize

## Markdown just works

**Bold**, *italic*, `inline code`, lists, quotes, and fenced code:

```ts
const notes = "yours, forever";
```

> Your words stay on your disk. No account, no cloud.
"#;

/// Write a starter `notes/Welcome.md` if it doesn't already exist. Used on the
/// first launch of a brand-new vault so it isn't an empty screen.
pub fn seed_welcome(root: &Path) -> AppResult<()> {
    let path = notes_root(root).join("Welcome.md");
    if !path.exists() {
        fs::write(path, WELCOME)?;
    }
    Ok(())
}

pub fn read_note(root: &Path, rel: &str) -> AppResult<String> {
    let path = resolve_rel(root, rel)?;
    if !path.is_file() {
        return Err(AppError::NotFound(rel.to_string()));
    }
    Ok(fs::read_to_string(path)?)
}

pub fn write_note(root: &Path, rel: &str, content: &str) -> AppResult<()> {
    let path = resolve_rel(root, rel)?;
    if !path.is_file() {
        return Err(AppError::NotFound(rel.to_string()));
    }
    fs::write(path, content)?;
    Ok(())
}

/// Pick a path that does not exist yet by suffixing " 2", " 3", …
fn available_path(dir: &Path, stem: &str, ext: Option<&str>) -> PathBuf {
    let make = |name: &str| match ext {
        Some(ext) => dir.join(format!("{name}.{ext}")),
        None => dir.join(name),
    };
    let mut candidate = make(stem);
    let mut counter = 2;
    while candidate.exists() {
        candidate = make(&format!("{stem} {counter}"));
        counter += 1;
    }
    candidate
}

/// Create an empty note inside `dir_rel` ("" = notes root). Returns its rel path.
pub fn create_note(root: &Path, dir_rel: &str, title: &str) -> AppResult<String> {
    create_note_with_content(root, dir_rel, title, "")
}

/// Create a note with initial Markdown content. Used by capture flows that
/// should never expose an empty file between create and write operations.
pub fn create_note_with_content(
    root: &Path,
    dir_rel: &str,
    title: &str,
    content: &str,
) -> AppResult<String> {
    let dir = resolve_rel(root, dir_rel)?;
    if !dir.is_dir() {
        return Err(AppError::NotFound(dir_rel.to_string()));
    }
    let path = available_path(&dir, &sanitize_name(title), Some("md"));
    fs::write(&path, content)?;
    rel_of(root, &path)
}

/// Create a folder inside `dir_rel`. Returns its rel path.
pub fn create_folder(root: &Path, dir_rel: &str, name: &str) -> AppResult<String> {
    let dir = resolve_rel(root, dir_rel)?;
    if !dir.is_dir() {
        return Err(AppError::NotFound(dir_rel.to_string()));
    }
    let path = available_path(&dir, &sanitize_name(name), None);
    fs::create_dir(&path)?;
    rel_of(root, &path)
}

/// Rename a note or folder in place. Returns the new rel path.
pub fn rename_entry(root: &Path, rel: &str, new_name: &str) -> AppResult<String> {
    let path = resolve_rel(root, rel)?;
    if !path.exists() {
        return Err(AppError::NotFound(rel.to_string()));
    }
    let dir = path
        .parent()
        .ok_or_else(|| AppError::InvalidPath(rel.to_string()))?
        .to_path_buf();
    let name = sanitize_name(new_name);
    let target = if path.is_dir() {
        available_path(&dir, &name, None)
    } else {
        available_path(&dir, &name, Some("md"))
    };
    fs::rename(&path, &target)?;
    let next = rel_of(root, &target)?;
    backlinks::rewrite_links(root, rel, &next)?;
    pins::remap(root, rel, &next)?;
    Ok(next)
}

/// Move a note or folder into `target_dir_rel`. Returns the new rel path.
pub fn move_entry(root: &Path, rel: &str, target_dir_rel: &str) -> AppResult<String> {
    let path = resolve_rel(root, rel)?;
    if !path.exists() {
        return Err(AppError::NotFound(rel.to_string()));
    }
    let target_dir = resolve_rel(root, target_dir_rel)?;
    if !target_dir.is_dir() {
        return Err(AppError::NotFound(target_dir_rel.to_string()));
    }
    // Refuse moving a folder into itself or its own subtree.
    if path.is_dir() && target_dir.starts_with(&path) {
        return Err(AppError::InvalidInput(
            "cannot move a folder into itself".to_string(),
        ));
    }
    if target_dir == path.parent().unwrap_or(Path::new("")) {
        return rel_of(root, &path);
    }
    let target = if path.is_dir() {
        let name = path
            .file_name()
            .ok_or_else(|| AppError::InvalidPath(rel.to_string()))?
            .to_string_lossy()
            .to_string();
        available_path(&target_dir, &name, None)
    } else {
        let stem = path
            .file_stem()
            .ok_or_else(|| AppError::InvalidPath(rel.to_string()))?
            .to_string_lossy()
            .to_string();
        available_path(&target_dir, &stem, Some("md"))
    };
    fs::rename(&path, &target)?;
    let next = rel_of(root, &target)?;
    backlinks::rewrite_links(root, rel, &next)?;
    pins::remap(root, rel, &next)?;
    Ok(next)
}

/// Move a note or folder to the OS trash.
pub fn delete_entry(root: &Path, rel: &str) -> AppResult<()> {
    let path = resolve_rel(root, rel)?;
    if !path.exists() {
        return Err(AppError::NotFound(rel.to_string()));
    }
    trash::delete(&path).map_err(|e| AppError::Other(format!("trash: {e}")))?;
    pins::remove_under(root, rel)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pins;
    use crate::vault::ensure_layout;
    use tempfile::tempdir;

    fn setup() -> tempfile::TempDir {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        dir
    }

    #[test]
    fn create_write_read_roundtrip() {
        let dir = setup();
        let rel = create_note(dir.path(), "", "My Note").unwrap();
        assert_eq!(rel, "My Note.md");
        write_note(dir.path(), &rel, "# hello").unwrap();
        assert_eq!(read_note(dir.path(), &rel).unwrap(), "# hello");
    }

    #[test]
    fn create_with_content_is_immediately_readable() {
        let dir = setup();
        let rel = create_note_with_content(dir.path(), "", "Captured", "remember this").unwrap();
        assert_eq!(rel, "Captured.md");
        assert_eq!(read_note(dir.path(), &rel).unwrap(), "remember this");
    }

    #[test]
    fn create_collision_suffixes() {
        let dir = setup();
        assert_eq!(create_note(dir.path(), "", "Note").unwrap(), "Note.md");
        assert_eq!(create_note(dir.path(), "", "Note").unwrap(), "Note 2.md");
        assert_eq!(create_note(dir.path(), "", "Note").unwrap(), "Note 3.md");
    }

    #[test]
    fn rename_and_move() {
        let dir = setup();
        let folder = create_folder(dir.path(), "", "projects").unwrap();
        let rel = create_note(dir.path(), "", "Idea").unwrap();
        pins::pin(dir.path(), &rel).unwrap();
        let renamed = rename_entry(dir.path(), &rel, "Big Idea").unwrap();
        assert_eq!(renamed, "Big Idea.md");
        assert_eq!(pins::list(dir.path()).unwrap(), ["Big Idea.md"]);
        let moved = move_entry(dir.path(), &renamed, &folder).unwrap();
        assert_eq!(moved, "projects/Big Idea.md");
        assert_eq!(pins::list(dir.path()).unwrap(), ["projects/Big Idea.md"]);
    }

    #[test]
    fn move_folder_into_itself_rejected() {
        let dir = setup();
        let folder = create_folder(dir.path(), "", "a").unwrap();
        let inner = create_folder(dir.path(), &folder, "b").unwrap();
        assert!(move_entry(dir.path(), &folder, &inner).is_err());
    }

    #[test]
    fn write_missing_note_errors() {
        let dir = setup();
        assert!(write_note(dir.path(), "nope.md", "x").is_err());
    }
}
