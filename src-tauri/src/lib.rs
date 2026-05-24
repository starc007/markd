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

#[derive(Debug, Clone, Serialize, Deserialize)]
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
    fs::create_dir_all(root.join("stickies")).map_err(|e| format!("Failed to create stickies: {e}"))?;
    fs::create_dir_all(root.join("bookmarks")).map_err(|e| format!("Failed to create bookmarks: {e}"))?;

    let manifest_path = root.join(MANIFEST_FILE);
    if manifest_path.exists() {
        return Ok((root.clone(), read_manifest(&root)?));
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
            id: sticky_id,
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

    fs::write(
        root.join(&note_file),
        "# Welcome to Draft\n\nThis is a file-first writing workspace.\n\n- [ ] Capture ideas quickly\n- [ ] Organize notes into folders and nested files\n- [ ] Let AI agents read and update the workspace safely\n\n```agent-access\nDocuments/Draft/Workspace\n```\n",
    )
    .map_err(|e| format!("Failed to write welcome note: {e}"))?;
    write_manifest(&root, &manifest)?;
    Ok((root, manifest))
}

fn read_note(root: &Path, note: &NoteRecord) -> Result<NoteDocument, String> {
    let content = fs::read_to_string(root.join(&note.path)).unwrap_or_default();
    Ok(NoteDocument {
        meta: note.clone(),
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
    let path = existing
        .as_ref()
        .map(|note| note.path.clone())
        .unwrap_or_else(|| note_path(&id, &input.title));

    fs::write(root.join(&path), input.content.clone())
        .map_err(|e| format!("Failed to write note file: {e}"))?;

    let record = NoteRecord {
        id: id.clone(),
        title: input.title,
        path,
        folder_id: input.folder_id,
        parent_id: input.parent_id,
        tags: input.tags,
        pinned: input.pinned,
        created_at: existing.map(|note| note.created_at).unwrap_or(timestamp),
        updated_at: timestamp,
    };

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

#[tauri::command]
fn upsert_folder(input: UpsertFolderRequest) -> Result<FolderRecord, String> {
    let (root, mut manifest) = ensure_workspace()?;
    let timestamp = now();
    let id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let existing = manifest.folders.iter().find(|folder| folder.id == id).cloned();
    let record = FolderRecord {
        id: id.clone(),
        name: input.name,
        parent_id: input.parent_id,
        created_at: existing.map(|folder| folder.created_at).unwrap_or(timestamp),
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
    let existing = manifest.stickies.iter().find(|sticky| sticky.id == id).cloned();
    let record = StickyRecord {
        id: id.clone(),
        content: input.content,
        color: input.color,
        created_at: existing.map(|sticky| sticky.created_at).unwrap_or(timestamp),
        updated_at: timestamp,
    };
    manifest.stickies.retain(|sticky| sticky.id != id);
    manifest.stickies.push(record.clone());
    manifest.updated_at = timestamp;
    write_manifest(&root, &manifest)?;
    Ok(record)
}

#[tauri::command]
fn upsert_bookmark(input: UpsertBookmarkRequest) -> Result<BookmarkRecord, String> {
    let (root, mut manifest) = ensure_workspace()?;
    let timestamp = now();
    let id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let existing = manifest.bookmarks.iter().find(|bookmark| bookmark.id == id).cloned();
    let record = BookmarkRecord {
        id: id.clone(),
        title: input.title,
        url: input.url,
        folder_id: input.folder_id,
        tags: input.tags,
        created_at: existing.map(|bookmark| bookmark.created_at).unwrap_or(timestamp),
        updated_at: timestamp,
    };
    manifest.bookmarks.retain(|bookmark| bookmark.id != id);
    manifest.bookmarks.push(record.clone());
    manifest.updated_at = timestamp;
    write_manifest(&root, &manifest)?;
    Ok(record)
}

#[tauri::command]
fn reveal_workspace_path() -> Result<String, String> {
    let (root, _) = ensure_workspace()?;
    Ok(root.to_string_lossy().to_string())
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
            upsert_folder,
            upsert_sticky,
            upsert_bookmark,
            reveal_workspace_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
