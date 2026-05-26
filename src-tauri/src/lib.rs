use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

const APP_DIR: &str = "Draft";
const WORKSPACE_DIR: &str = "Workspace";
const MANIFEST_FILE: &str = "manifest.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceManifest {
    pub version: u32,
    pub workspace_id: String,
    pub name: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub folders: Vec<FolderRecord>,
    pub notes: Vec<NoteRecord>,
    pub stickies: Vec<StickyRecord>,
    pub bookmarks: Vec<BookmarkRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderRecord {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteRecord {
    pub id: String,
    pub title: String,
    pub path: String,
    pub folder_id: Option<String>,
    pub parent_id: Option<String>,
    pub tags: Vec<String>,
    pub pinned: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StickyRecord {
    pub id: String,
    #[serde(default)]
    pub path: String,
    pub content: String,
    pub color: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookmarkRecord {
    pub id: String,
    pub title: String,
    pub url: String,
    pub folder_id: Option<String>,
    pub tags: Vec<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceSnapshot {
    pub root_path: String,
    pub manifest: WorkspaceManifest,
    pub active_note: Option<NoteDocument>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteDocument {
    pub meta: NoteRecord,
    pub content: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpsertNoteRequest {
    pub id: Option<String>,
    pub title: String,
    pub content: String,
    pub folder_id: Option<String>,
    pub parent_id: Option<String>,
    pub tags: Vec<String>,
    pub pinned: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpsertFolderRequest {
    pub id: Option<String>,
    pub name: String,
    pub parent_id: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpsertStickyRequest {
    pub id: Option<String>,
    pub content: String,
    pub color: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpsertBookmarkRequest {
    pub id: Option<String>,
    pub title: String,
    pub url: String,
    pub folder_id: Option<String>,
    pub tags: Vec<String>,
}

fn workspace_root() -> Result<PathBuf, String> {
    let documents = dirs::document_dir().ok_or("Documents directory not found")?;
    Ok(documents.join(APP_DIR).join(WORKSPACE_DIR))
}

fn now() -> i64 {
    Utc::now().timestamp_millis()
}

fn slugify(value: &str) -> String {
    let slug = value
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() {
                ch.to_ascii_lowercase()
            } else if ch.is_whitespace() || ch == '-' || ch == '_' {
                '-'
            } else {
                '\0'
            }
        })
        .filter(|ch| *ch != '\0')
        .collect::<String>()
        .split('-')
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>()
        .join("-");

    if slug.is_empty() {
        "untitled".to_string()
    } else {
        slug
    }
}

fn note_path(id: &str, title: &str) -> String {
    format!("notes/{}-{}.md", slugify(title), &id[..8.min(id.len())])
}

fn sticky_path(id: &str) -> String {
    format!("stickies/sticky-{}.md", &id[..8.min(id.len())])
}

fn asset_path(source_path: &Path) -> String {
    let id = Uuid::new_v4().to_string();
    let stem = source_path
        .file_stem()
        .and_then(|value| value.to_str())
        .map(slugify)
        .unwrap_or_else(|| "image".to_string());
    let extension = source_path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase())
        .unwrap_or_else(|| "png".to_string());

    format!("assets/{}-{}.{}", stem, &id[..8.min(id.len())], extension)
}

fn rename_note_file_if_needed(
    root: &Path,
    existing: Option<&NoteRecord>,
    id: &str,
    title: &str,
) -> Result<String, String> {
    let next_path = note_path(id, title);
    let Some(existing_note) = existing else {
        return Ok(next_path);
    };

    if existing_note.path == next_path {
        return Ok(existing_note.path.clone());
    }

    let old_path = root.join(&existing_note.path);
    let new_path = root.join(&next_path);
    if old_path.exists() {
        if let Some(parent) = new_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create note directory: {e}"))?;
        }
        fs::rename(&old_path, &new_path).map_err(|e| format!("Failed to rename note file: {e}"))?;
    }

    Ok(next_path)
}

fn yaml_string(value: &str) -> String {
    format!("\"{}\"", value.replace('\\', "\\\\").replace('"', "\\\""))
}

fn yaml_optional_string(value: &Option<String>) -> String {
    value
        .as_ref()
        .map(|item| yaml_string(item))
        .unwrap_or_else(|| "null".to_string())
}

fn yaml_string_array(values: &[String]) -> String {
    format!(
        "[{}]",
        values
            .iter()
            .map(|value| yaml_string(value))
            .collect::<Vec<_>>()
            .join(", ")
    )
}

fn parse_yaml_string(value: &str) -> String {
    let trimmed = value.trim();
    if trimmed.len() >= 2 && trimmed.starts_with('"') && trimmed.ends_with('"') {
        let inner = &trimmed[1..trimmed.len() - 1];
        let mut output = String::new();
        let mut escaped = false;

        for ch in inner.chars() {
            if escaped {
                output.push(ch);
                escaped = false;
            } else if ch == '\\' {
                escaped = true;
            } else {
                output.push(ch);
            }
        }

        output
    } else {
        trimmed.to_string()
    }
}

fn parse_yaml_optional_string(value: Option<&String>) -> Option<String> {
    value.and_then(|item| {
        let trimmed = item.trim();
        if trimmed == "null" || trimmed.is_empty() {
            None
        } else {
            Some(parse_yaml_string(trimmed))
        }
    })
}

fn parse_yaml_string_array(value: Option<&String>) -> Vec<String> {
    let Some(raw) = value else {
        return Vec::new();
    };
    let trimmed = raw.trim();
    if !trimmed.starts_with('[') || !trimmed.ends_with(']') {
        return Vec::new();
    }

    trimmed[1..trimmed.len() - 1]
        .split(',')
        .map(parse_yaml_string)
        .map(|item| item.trim().to_string())
        .filter(|item| !item.is_empty())
        .collect()
}

fn note_frontmatter(record: &NoteRecord) -> String {
    [
        "---".to_string(),
        format!("id: {}", yaml_string(&record.id)),
        format!("title: {}", yaml_string(&record.title)),
        format!("folderId: {}", yaml_optional_string(&record.folder_id)),
        format!("parentId: {}", yaml_optional_string(&record.parent_id)),
        format!("tags: {}", yaml_string_array(&record.tags)),
        format!("pinned: {}", record.pinned),
        format!("createdAt: {}", record.created_at),
        format!("updatedAt: {}", record.updated_at),
        "---".to_string(),
    ]
    .join("\n")
}

fn split_frontmatter(raw: &str) -> Option<(std::collections::HashMap<String, String>, String)> {
    let rest = raw.strip_prefix("---\n")?;
    let (frontmatter, body) = rest.split_once("\n---")?;
    let body = body.strip_prefix('\n').unwrap_or(body).to_string();
    let values = frontmatter
        .lines()
        .filter_map(|line| {
            let (key, value) = line.split_once(':')?;
            Some((key.trim().to_string(), value.trim().to_string()))
        })
        .collect::<std::collections::HashMap<_, _>>();

    Some((values, body))
}

fn note_record_from_frontmatter(
    fallback: &NoteRecord,
    values: &std::collections::HashMap<String, String>,
) -> NoteRecord {
    NoteRecord {
        id: values
            .get("id")
            .map(|value| parse_yaml_string(value))
            .unwrap_or_else(|| fallback.id.clone()),
        title: values
            .get("title")
            .map(|value| parse_yaml_string(value))
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| fallback.title.clone()),
        path: fallback.path.clone(),
        folder_id: parse_yaml_optional_string(values.get("folderId"))
            .or_else(|| fallback.folder_id.clone()),
        parent_id: parse_yaml_optional_string(values.get("parentId"))
            .or_else(|| fallback.parent_id.clone()),
        tags: {
            let tags = parse_yaml_string_array(values.get("tags"));
            if tags.is_empty() {
                fallback.tags.clone()
            } else {
                tags
            }
        },
        pinned: values
            .get("pinned")
            .and_then(|value| value.parse::<bool>().ok())
            .unwrap_or(fallback.pinned),
        created_at: values
            .get("createdAt")
            .and_then(|value| value.parse::<i64>().ok())
            .unwrap_or(fallback.created_at),
        updated_at: values
            .get("updatedAt")
            .and_then(|value| value.parse::<i64>().ok())
            .unwrap_or(fallback.updated_at),
    }
}

fn read_note_file(root: &Path, note: &NoteRecord) -> (NoteRecord, String, bool) {
    let raw = fs::read_to_string(root.join(&note.path)).unwrap_or_default();
    if let Some((values, body)) = split_frontmatter(&raw) {
        (note_record_from_frontmatter(note, &values), body, true)
    } else {
        (note.clone(), raw, false)
    }
}

fn write_note_file(root: &Path, record: &NoteRecord, content: &str) -> Result<(), String> {
    let body = content.trim_start_matches('\n');
    let raw = if body.is_empty() {
        format!("{}\n", note_frontmatter(record))
    } else {
        format!("{}\n{}\n", note_frontmatter(record), body)
    };

    fs::write(root.join(&record.path), raw).map_err(|e| format!("Failed to write note file: {e}"))
}

fn sync_note_frontmatter(root: &Path, manifest: &mut WorkspaceManifest) -> Result<(), String> {
    let mut changed = false;
    let notes = manifest
        .notes
        .iter()
        .map(|note| {
            let (record, content, has_frontmatter) = read_note_file(root, note);
            if !has_frontmatter {
                write_note_file(root, &record, &content)?;
                changed = true;
            }
            if &record != note {
                changed = true;
            }
            Ok(record)
        })
        .collect::<Result<Vec<_>, String>>()?;

    manifest.notes = notes;
    if changed {
        write_manifest(root, manifest)?;
    }

    Ok(())
}

fn sticky_frontmatter(record: &StickyRecord) -> String {
    [
        "---".to_string(),
        format!("id: {}", yaml_string(&record.id)),
        format!("color: {}", yaml_string(&record.color)),
        format!("createdAt: {}", record.created_at),
        format!("updatedAt: {}", record.updated_at),
        "---".to_string(),
    ]
    .join("\n")
}

fn sticky_record_from_frontmatter(
    fallback: &StickyRecord,
    values: &std::collections::HashMap<String, String>,
) -> StickyRecord {
    StickyRecord {
        id: values
            .get("id")
            .map(|value| parse_yaml_string(value))
            .unwrap_or_else(|| fallback.id.clone()),
        path: if fallback.path.is_empty() {
            sticky_path(&fallback.id)
        } else {
            fallback.path.clone()
        },
        content: fallback.content.clone(),
        color: values
            .get("color")
            .map(|value| parse_yaml_string(value))
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| fallback.color.clone()),
        created_at: values
            .get("createdAt")
            .and_then(|value| value.parse::<i64>().ok())
            .unwrap_or(fallback.created_at),
        updated_at: values
            .get("updatedAt")
            .and_then(|value| value.parse::<i64>().ok())
            .unwrap_or(fallback.updated_at),
    }
}

fn read_sticky_file(root: &Path, sticky: &StickyRecord) -> (StickyRecord, String, bool) {
    let path = if sticky.path.is_empty() {
        sticky_path(&sticky.id)
    } else {
        sticky.path.clone()
    };
    let fallback = StickyRecord {
        path: path.clone(),
        ..sticky.clone()
    };
    let raw = fs::read_to_string(root.join(&path)).unwrap_or_default();
    if let Some((values, body)) = split_frontmatter(&raw) {
        let mut record = sticky_record_from_frontmatter(&fallback, &values);
        record.content = body.clone();
        (record, body, true)
    } else {
        (fallback.clone(), fallback.content.clone(), false)
    }
}

fn write_sticky_file(root: &Path, record: &StickyRecord, content: &str) -> Result<(), String> {
    let body = content.trim_start_matches('\n');
    let raw = if body.is_empty() {
        format!("{}\n", sticky_frontmatter(record))
    } else {
        format!("{}\n{}\n", sticky_frontmatter(record), body)
    };

    fs::write(root.join(&record.path), raw).map_err(|e| format!("Failed to write sticky file: {e}"))
}

fn sync_sticky_files(root: &Path, manifest: &mut WorkspaceManifest) -> Result<(), String> {
    let mut changed = false;
    let stickies = manifest
        .stickies
        .iter()
        .map(|sticky| {
            let (record, content, has_frontmatter) = read_sticky_file(root, sticky);
            if !has_frontmatter {
                write_sticky_file(root, &record, &content)?;
                changed = true;
            }
            if record.id != sticky.id
                || record.path != sticky.path
                || record.content != sticky.content
                || record.color != sticky.color
                || record.created_at != sticky.created_at
                || record.updated_at != sticky.updated_at
            {
                changed = true;
            }
            Ok(record)
        })
        .collect::<Result<Vec<_>, String>>()?;

    manifest.stickies = stickies;
    if changed {
        write_manifest(root, manifest)?;
    }

    Ok(())
}

fn read_manifest(root: &Path) -> Result<WorkspaceManifest, String> {
    let path = root.join(MANIFEST_FILE);
    let raw = fs::read_to_string(&path).map_err(|e| format!("Failed to read manifest: {e}"))?;
    serde_json::from_str(&raw).map_err(|e| format!("Failed to parse manifest: {e}"))
}

fn write_manifest(root: &Path, manifest: &WorkspaceManifest) -> Result<(), String> {
    let path = root.join(MANIFEST_FILE);
    let raw = serde_json::to_string_pretty(manifest)
        .map_err(|e| format!("Failed to serialize manifest: {e}"))?;
    fs::write(path, raw).map_err(|e| format!("Failed to write manifest: {e}"))
}

fn ensure_workspace() -> Result<(PathBuf, WorkspaceManifest), String> {
    let root = workspace_root()?;
    fs::create_dir_all(root.join("notes")).map_err(|e| format!("Failed to create notes: {e}"))?;
    fs::create_dir_all(root.join("stickies"))
        .map_err(|e| format!("Failed to create stickies: {e}"))?;
    fs::create_dir_all(root.join("bookmarks"))
        .map_err(|e| format!("Failed to create bookmarks: {e}"))?;
    fs::create_dir_all(root.join("assets")).map_err(|e| format!("Failed to create assets: {e}"))?;

    let manifest_path = root.join(MANIFEST_FILE);
    if manifest_path.exists() {
        let mut manifest = read_manifest(&root)?;
        sync_note_frontmatter(&root, &mut manifest)?;
        sync_sticky_files(&root, &mut manifest)?;
        return Ok((root.clone(), manifest));
    }

    let timestamp = now();
    let folder_id = Uuid::new_v4().to_string();
    let note_id = Uuid::new_v4().to_string();
    let sticky_id = Uuid::new_v4().to_string();
    let bookmark_id = Uuid::new_v4().to_string();
    let note_file = note_path(&note_id, "Welcome to Draft");

    let manifest = WorkspaceManifest {
        version: 1,
        workspace_id: Uuid::new_v4().to_string(),
        name: "Draft Workspace".to_string(),
        created_at: timestamp,
        updated_at: timestamp,
        folders: vec![FolderRecord {
            id: folder_id.clone(),
            name: "Writing".to_string(),
            parent_id: None,
            created_at: timestamp,
            updated_at: timestamp,
        }],
        notes: vec![NoteRecord {
            id: note_id.clone(),
            title: "Welcome to Draft".to_string(),
            path: note_file.clone(),
            folder_id: Some(folder_id.clone()),
            parent_id: None,
            tags: vec!["start".to_string()],
            pinned: true,
            created_at: timestamp,
            updated_at: timestamp,
        }],
        stickies: vec![StickyRecord {
            id: sticky_id.clone(),
            path: sticky_path(&sticky_id),
            content: "Everything in this workspace is plain files. Agents can edit notes directly in Documents/Draft/Workspace.".to_string(),
            color: "mint".to_string(),
            created_at: timestamp,
            updated_at: timestamp,
        }],
        bookmarks: vec![BookmarkRecord {
            id: bookmark_id,
            title: "beUI motion reference".to_string(),
            url: "https://beui.saura3h.xyz".to_string(),
            folder_id: Some(folder_id),
            tags: vec!["ui".to_string(), "motion".to_string()],
            created_at: timestamp,
            updated_at: timestamp,
        }],
    };

    write_note_file(
        &root,
        manifest
            .notes
            .first()
            .ok_or("Welcome note record missing")?,
        "This is a file-first writing workspace.\n\n- [ ] Capture ideas quickly\n- [ ] Organize notes into folders and nested files\n- [ ] Let AI agents read and update the workspace safely\n\n```agent-access\nDocuments/Draft/Workspace\n```\n",
    )?;
    write_sticky_file(
        &root,
        manifest
            .stickies
            .first()
            .ok_or("Welcome sticky record missing")?,
        manifest
            .stickies
            .first()
            .map(|sticky| sticky.content.as_str())
            .ok_or("Welcome sticky content missing")?,
    )?;
    write_manifest(&root, &manifest)?;
    Ok((root, manifest))
}

fn read_note(root: &Path, note: &NoteRecord) -> Result<NoteDocument, String> {
    let (record, content, has_frontmatter) = read_note_file(root, note);
    if !has_frontmatter || &record != note {
        write_note_file(root, &record, &content)?;
    }

    Ok(NoteDocument {
        meta: record,
        content,
    })
}

#[tauri::command]
fn load_workspace() -> Result<WorkspaceSnapshot, String> {
    let (root, manifest) = ensure_workspace()?;
    let active_note = manifest
        .notes
        .first()
        .map(|note| read_note(&root, note))
        .transpose()?;

    Ok(WorkspaceSnapshot {
        root_path: root.to_string_lossy().to_string(),
        manifest,
        active_note,
    })
}

#[tauri::command]
fn get_note(id: String) -> Result<Option<NoteDocument>, String> {
    let (root, manifest) = ensure_workspace()?;
    manifest
        .notes
        .iter()
        .find(|note| note.id == id)
        .map(|note| read_note(&root, note))
        .transpose()
}

#[tauri::command]
fn upsert_note(input: UpsertNoteRequest) -> Result<NoteDocument, String> {
    let (root, mut manifest) = ensure_workspace()?;
    let timestamp = now();
    let id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let existing = manifest.notes.iter().find(|note| note.id == id).cloned();
    let path = rename_note_file_if_needed(&root, existing.as_ref(), &id, &input.title)?;

    let record = NoteRecord {
        id: id.clone(),
        title: input.title,
        path,
        folder_id: input.folder_id,
        parent_id: input.parent_id,
        tags: input.tags,
        pinned: input.pinned,
        created_at: existing
            .as_ref()
            .map(|note| note.created_at)
            .unwrap_or(timestamp),
        updated_at: timestamp,
    };

    write_note_file(&root, &record, &input.content)?;

    manifest.notes.retain(|note| note.id != id);
    manifest.notes.insert(0, record.clone());
    manifest.updated_at = timestamp;
    write_manifest(&root, &manifest)?;

    Ok(NoteDocument {
        meta: record,
        content: input.content,
    })
}

#[tauri::command]
fn delete_note(id: String) -> Result<WorkspaceManifest, String> {
    let (root, mut manifest) = ensure_workspace()?;
    if let Some(note) = manifest.notes.iter().find(|note| note.id == id) {
        let _ = fs::remove_file(root.join(&note.path));
    }
    manifest.notes.retain(|note| note.id != id);
    manifest.updated_at = now();
    write_manifest(&root, &manifest)?;
    Ok(manifest)
}

fn collect_child_folder_ids(
    manifest: &WorkspaceManifest,
    folder_id: &str,
    output: &mut Vec<String>,
) {
    output.push(folder_id.to_string());
    let child_ids = manifest
        .folders
        .iter()
        .filter(|folder| folder.parent_id.as_deref() == Some(folder_id))
        .map(|folder| folder.id.clone())
        .collect::<Vec<_>>();

    for child_id in child_ids {
        collect_child_folder_ids(manifest, &child_id, output);
    }
}

#[tauri::command]
fn delete_folder(id: String) -> Result<WorkspaceManifest, String> {
    let (root, mut manifest) = ensure_workspace()?;
    let mut folder_ids = Vec::new();
    collect_child_folder_ids(&manifest, &id, &mut folder_ids);

    for note in manifest.notes.iter().filter(|note| {
        note.folder_id
            .as_ref()
            .is_some_and(|folder_id| folder_ids.contains(folder_id))
    }) {
        let _ = fs::remove_file(root.join(&note.path));
    }

    manifest.notes.retain(|note| {
        !note
            .folder_id
            .as_ref()
            .is_some_and(|folder_id| folder_ids.contains(folder_id))
    });
    manifest.bookmarks.retain(|bookmark| {
        !bookmark
            .folder_id
            .as_ref()
            .is_some_and(|folder_id| folder_ids.contains(folder_id))
    });
    manifest
        .folders
        .retain(|folder| !folder_ids.contains(&folder.id));
    manifest.updated_at = now();
    write_manifest(&root, &manifest)?;
    Ok(manifest)
}

#[tauri::command]
fn upsert_folder(input: UpsertFolderRequest) -> Result<FolderRecord, String> {
    let (root, mut manifest) = ensure_workspace()?;
    let timestamp = now();
    let id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let existing = manifest
        .folders
        .iter()
        .find(|folder| folder.id == id)
        .cloned();
    let record = FolderRecord {
        id: id.clone(),
        name: input.name,
        parent_id: input.parent_id,
        created_at: existing
            .map(|folder| folder.created_at)
            .unwrap_or(timestamp),
        updated_at: timestamp,
    };
    manifest.folders.retain(|folder| folder.id != id);
    manifest.folders.push(record.clone());
    manifest.updated_at = timestamp;
    write_manifest(&root, &manifest)?;
    Ok(record)
}

#[tauri::command]
fn upsert_sticky(input: UpsertStickyRequest) -> Result<StickyRecord, String> {
    let (root, mut manifest) = ensure_workspace()?;
    let timestamp = now();
    let id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let existing = manifest
        .stickies
        .iter()
        .find(|sticky| sticky.id == id)
        .cloned();
    let path = existing
        .as_ref()
        .map(|sticky| {
            if sticky.path.is_empty() {
                sticky_path(&id)
            } else {
                sticky.path.clone()
            }
        })
        .unwrap_or_else(|| sticky_path(&id));
    let record = StickyRecord {
        id: id.clone(),
        path,
        content: input.content.clone(),
        color: input.color,
        created_at: existing
            .map(|sticky| sticky.created_at)
            .unwrap_or(timestamp),
        updated_at: timestamp,
    };
    write_sticky_file(&root, &record, &input.content)?;
    manifest.stickies.retain(|sticky| sticky.id != id);
    manifest.stickies.push(record.clone());
    manifest.updated_at = timestamp;
    write_manifest(&root, &manifest)?;
    Ok(record)
}

#[tauri::command]
fn delete_sticky(id: String) -> Result<WorkspaceManifest, String> {
    let (root, mut manifest) = ensure_workspace()?;
    if let Some(sticky) = manifest.stickies.iter().find(|sticky| sticky.id == id) {
        let path = if sticky.path.is_empty() {
            sticky_path(&sticky.id)
        } else {
            sticky.path.clone()
        };
        let _ = fs::remove_file(root.join(path));
    }
    manifest.stickies.retain(|sticky| sticky.id != id);
    manifest.updated_at = now();
    write_manifest(&root, &manifest)?;
    Ok(manifest)
}

#[tauri::command]
fn upsert_bookmark(input: UpsertBookmarkRequest) -> Result<BookmarkRecord, String> {
    let (root, mut manifest) = ensure_workspace()?;
    let timestamp = now();
    let id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let existing = manifest
        .bookmarks
        .iter()
        .find(|bookmark| bookmark.id == id)
        .cloned();
    let record = BookmarkRecord {
        id: id.clone(),
        title: input.title,
        url: input.url,
        folder_id: input.folder_id,
        tags: input.tags,
        created_at: existing
            .map(|bookmark| bookmark.created_at)
            .unwrap_or(timestamp),
        updated_at: timestamp,
    };
    manifest.bookmarks.retain(|bookmark| bookmark.id != id);
    manifest.bookmarks.push(record.clone());
    manifest.updated_at = timestamp;
    write_manifest(&root, &manifest)?;
    Ok(record)
}

#[tauri::command]
fn delete_bookmark(id: String) -> Result<WorkspaceManifest, String> {
    let (root, mut manifest) = ensure_workspace()?;
    manifest.bookmarks.retain(|bookmark| bookmark.id != id);
    manifest.updated_at = now();
    write_manifest(&root, &manifest)?;
    Ok(manifest)
}

#[tauri::command]
fn reveal_workspace_path() -> Result<String, String> {
    let (root, _) = ensure_workspace()?;
    Ok(root.to_string_lossy().to_string())
}

#[tauri::command]
fn import_image_asset(source_path: String) -> Result<String, String> {
    let (root, _) = ensure_workspace()?;
    let source = PathBuf::from(source_path);
    if !source.exists() {
        return Err("Image file does not exist".to_string());
    }

    let extension = source
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase())
        .unwrap_or_default();
    let allowed = ["png", "jpg", "jpeg", "gif", "webp", "avif", "svg"];
    if !allowed.contains(&extension.as_str()) {
        return Err("Unsupported image type".to_string());
    }

    let relative_path = asset_path(&source);
    let destination = root.join(&relative_path);
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create assets: {e}"))?;
    }
    fs::copy(&source, &destination).map_err(|e| format!("Failed to import image: {e}"))?;

    Ok(relative_path)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            load_workspace,
            get_note,
            upsert_note,
            delete_note,
            delete_folder,
            upsert_folder,
            upsert_sticky,
            delete_sticky,
            upsert_bookmark,
            delete_bookmark,
            reveal_workspace_path,
            import_image_asset,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
