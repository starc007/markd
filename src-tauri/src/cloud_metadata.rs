use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::vault::{resolve_rel, DATA_DIR};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PublishedShare {
    pub id: String,
    pub entry_id: String,
    pub slug: String,
    pub url: String,
    pub title: String,
    pub content_hash: String,
    pub published_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudEntry {
    pub entry_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub share: Option<PublishedShare>,
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct CloudMetadata {
    #[serde(default)]
    entries: BTreeMap<String, CloudEntry>,
}

fn store_path(root: &Path) -> PathBuf {
    root.join(DATA_DIR).join("cloud.json")
}

fn read(root: &Path) -> AppResult<CloudMetadata> {
    let path = store_path(root);
    if !path.exists() {
        return Ok(CloudMetadata::default());
    }
    Ok(serde_json::from_str(&fs::read_to_string(path)?)?)
}

fn save(root: &Path, metadata: &CloudMetadata) -> AppResult<()> {
    let path = store_path(root);
    let temp = path.with_extension(format!("json.tmp-{}", Uuid::new_v4().simple()));
    fs::write(&temp, serde_json::to_string_pretty(metadata)?)?;
    fs::rename(&temp, &path).inspect_err(|_| {
        let _ = fs::remove_file(&temp);
    })?;
    Ok(())
}

fn ensure_note(root: &Path, rel: &str) -> AppResult<()> {
    let path = resolve_rel(root, rel)?;
    if !path.is_file() || path.extension().and_then(|ext| ext.to_str()) != Some("md") {
        return Err(AppError::NotFound(rel.to_string()));
    }
    Ok(())
}

pub fn entry(root: &Path, rel: &str) -> AppResult<CloudEntry> {
    ensure_note(root, rel)?;
    let mut metadata = read(root)?;
    if let Some(entry) = metadata.entries.get(rel) {
        return Ok(entry.clone());
    }
    let entry = CloudEntry {
        entry_id: format!("entry_{}", Uuid::new_v4().simple()),
        share: None,
    };
    metadata.entries.insert(rel.to_string(), entry.clone());
    save(root, &metadata)?;
    Ok(entry)
}

pub fn get(root: &Path, rel: &str) -> AppResult<Option<CloudEntry>> {
    Ok(read(root)?.entries.get(rel).cloned())
}

pub fn set_share(root: &Path, rel: &str, share: PublishedShare) -> AppResult<()> {
    let mut metadata = read(root)?;
    let cloud_entry = metadata
        .entries
        .get_mut(rel)
        .ok_or_else(|| AppError::NotFound(rel.to_string()))?;
    if cloud_entry.entry_id != share.entry_id {
        return Err(AppError::InvalidInput(
            "published note does not match its local entry".to_string(),
        ));
    }
    cloud_entry.share = Some(share);
    save(root, &metadata)
}

pub fn clear_share(root: &Path, rel: &str) -> AppResult<()> {
    let mut metadata = read(root)?;
    let Some(entry) = metadata.entries.get_mut(rel) else {
        return Ok(());
    };
    entry.share = None;
    save(root, &metadata)
}

pub fn has_published_under(root: &Path, rel: &str) -> AppResult<bool> {
    Ok(read(root)?.entries.iter().any(|(entry_rel, entry)| {
        entry.share.is_some() && (entry_rel == rel || entry_rel.starts_with(&format!("{rel}/")))
    }))
}

/// Preserve cloud identity after a note or folder rename/move.
pub fn remap(root: &Path, from: &str, to: &str) -> AppResult<()> {
    let metadata = read(root)?;
    let mut changed = false;
    let mut entries = BTreeMap::new();
    for (rel, entry) in metadata.entries {
        let next = if rel == from {
            changed = true;
            to.to_string()
        } else if rel.starts_with(&format!("{from}/")) {
            changed = true;
            format!("{to}{}", &rel[from.len()..])
        } else {
            rel
        };
        entries.insert(next, entry);
    }
    if changed {
        save(root, &CloudMetadata { entries })?;
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
        fs::write(notes_root(dir.path()).join("projects/Plan.md"), "# Plan").unwrap();
        dir
    }

    #[test]
    fn creates_and_reuses_stable_entry_id() {
        let dir = setup();
        let first = entry(dir.path(), "projects/Plan.md").unwrap();
        let second = entry(dir.path(), "projects/Plan.md").unwrap();
        assert_eq!(first.entry_id, second.entry_id);
        assert!(first.entry_id.starts_with("entry_"));
    }

    #[test]
    fn remaps_folder_descendants() {
        let dir = setup();
        let before = entry(dir.path(), "projects/Plan.md").unwrap();
        remap(dir.path(), "projects", "work").unwrap();
        let after = get(dir.path(), "work/Plan.md").unwrap().unwrap();
        assert_eq!(before.entry_id, after.entry_id);
        assert!(get(dir.path(), "projects/Plan.md").unwrap().is_none());
    }

    #[test]
    fn detects_published_entries_before_deletion() {
        let dir = setup();
        let cloud_entry = entry(dir.path(), "projects/Plan.md").unwrap();
        set_share(
            dir.path(),
            "projects/Plan.md",
            PublishedShare {
                id: "share_123".into(),
                entry_id: cloud_entry.entry_id,
                slug: "public-slug".into(),
                url: "https://usemarkd.app/s/public-slug".into(),
                title: "Plan".into(),
                content_hash: "abc".into(),
                published_at: 1,
                updated_at: 1,
            },
        )
        .unwrap();
        assert!(has_published_under(dir.path(), "projects").unwrap());
        assert!(has_published_under(dir.path(), "projects/Plan.md").unwrap());
        assert!(!has_published_under(dir.path(), "other").unwrap());
    }
}
