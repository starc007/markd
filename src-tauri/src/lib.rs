use chrono::Utc;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

const APP_DIR: &str = "Draft";
const WORKSPACE_DIR: &str = "Workspace";
const LEGACY_MANIFEST_FILE: &str = "manifest.json";
const FOLDER_META_FILE: &str = ".folder.yml";

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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveImageAssetRequest {
    pub bytes: Vec<u8>,
    pub file_name: String,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NoteFrontmatter {
    id: Option<String>,
    title: Option<String>,
    folder_id: Option<String>,
    parent_id: Option<String>,
    tags: Option<Vec<String>>,
    pinned: Option<bool>,
    created_at: Option<i64>,
    updated_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NoteFrontmatterOut {
    id: String,
    title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    folder_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    parent_id: Option<String>,
    tags: Vec<String>,
    pinned: bool,
    created_at: i64,
    updated_at: i64,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FolderFrontmatter {
    id: Option<String>,
    name: Option<String>,
    parent_id: Option<String>,
    created_at: Option<i64>,
    updated_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FolderFrontmatterOut {
    id: String,
    name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    parent_id: Option<String>,
    created_at: i64,
    updated_at: i64,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StickyFrontmatter {
    id: Option<String>,
    color: Option<String>,
    created_at: Option<i64>,
    updated_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StickyFrontmatterOut {
    id: String,
    color: String,
    created_at: i64,
    updated_at: i64,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BookmarkFrontmatter {
    id: Option<String>,
    title: Option<String>,
    url: Option<String>,
    folder_id: Option<String>,
    tags: Option<Vec<String>>,
    created_at: Option<i64>,
    updated_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BookmarkFrontmatterOut {
    id: String,
    title: String,
    url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    folder_id: Option<String>,
    tags: Vec<String>,
    created_at: i64,
    updated_at: i64,
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

fn path_slug_id(title: &str, id: &str) -> String {
    format!("{}-{}", slugify(title), &id[..8.min(id.len())])
}

fn note_path_in(base: &str, id: &str, title: &str) -> String {
    if base.is_empty() {
        format!("notes/{}.md", path_slug_id(title, id))
    } else {
        format!("notes/{}/{}.md", base, path_slug_id(title, id))
    }
}

fn sticky_path(id: &str) -> String {
    format!("stickies/sticky-{}.md", &id[..8.min(id.len())])
}

fn bookmark_path(id: &str, title: &str) -> String {
    format!("bookmarks/{}-{}.md", slugify(title), &id[..8.min(id.len())])
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

fn relative_path(root: &Path, path: &Path) -> Result<String, String> {
    path.strip_prefix(root)
        .map_err(|e| format!("Failed to resolve workspace path: {e}"))
        .map(|value| value.to_string_lossy().replace('\\', "/"))
}

fn folder_id_from_rel(rel: &str) -> String {
    format!("folder:{}", rel.trim_matches('/'))
}

fn rel_from_folder_id(id: &str) -> Option<String> {
    id.strip_prefix("folder:")
        .map(|value| value.trim_matches('/').to_string())
        .filter(|value| !value.is_empty())
}

fn split_frontmatter<T: DeserializeOwned>(raw: &str) -> Option<(T, String)> {
    let rest = raw.strip_prefix("---\n")?;
    let (frontmatter, body) = rest.split_once("\n---")?;
    let body = body.strip_prefix('\n').unwrap_or(body).to_string();
    let values = serde_yaml::from_str::<T>(frontmatter).ok()?;
    Some((values, body))
}

fn write_frontmatter<T: Serialize>(meta: &T, body: &str) -> Result<String, String> {
    let yaml = serde_yaml::to_string(meta).map_err(|e| format!("Failed to serialize YAML: {e}"))?;
    let body = body.trim_start_matches('\n');
    if body.is_empty() {
        Ok(format!("---\n{}---\n", yaml))
    } else {
        Ok(format!("---\n{}---\n{}\n", yaml, body))
    }
}

fn read_to_string(path: &Path) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| format!("Failed to read {}: {e}", path.display()))
}

fn ensure_dirs(root: &Path) -> Result<(), String> {
    for dir in ["notes", "stickies", "bookmarks", "assets"] {
        fs::create_dir_all(root.join(dir)).map_err(|e| format!("Failed to create {dir}: {e}"))?;
    }
    Ok(())
}

fn walk_files(root: &Path, output: &mut Vec<PathBuf>) -> Result<(), String> {
    if !root.exists() {
        return Ok(());
    }

    for entry in fs::read_dir(root).map_err(|e| format!("Failed to read directory: {e}"))? {
        let path = entry
            .map_err(|e| format!("Failed to read directory entry: {e}"))?
            .path();
        if path.is_dir() {
            walk_files(&path, output)?;
        } else {
            output.push(path);
        }
    }

    Ok(())
}

fn walk_dirs(root: &Path, output: &mut Vec<PathBuf>) -> Result<(), String> {
    if !root.exists() {
        return Ok(());
    }

    for entry in fs::read_dir(root).map_err(|e| format!("Failed to read directory: {e}"))? {
        let path = entry
            .map_err(|e| format!("Failed to read directory entry: {e}"))?
            .path();
        if path.is_dir() {
            output.push(path.clone());
            walk_dirs(&path, output)?;
        }
    }

    Ok(())
}

fn title_from_file(path: &Path) -> String {
    path.file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("Untitled")
        .rsplit_once('-')
        .map(|(title, suffix)| {
            if suffix.len() == 8 && suffix.chars().all(|ch| ch.is_ascii_hexdigit()) {
                title
            } else {
                path.file_stem()
                    .and_then(|value| value.to_str())
                    .unwrap_or("Untitled")
            }
        })
        .unwrap_or_else(|| {
            path.file_stem()
                .and_then(|value| value.to_str())
                .unwrap_or("Untitled")
        })
        .split('-')
        .filter(|part| !part.is_empty())
        .map(|part| {
            let mut chars = part.chars();
            chars
                .next()
                .map(|first| first.to_ascii_uppercase().to_string() + chars.as_str())
                .unwrap_or_default()
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn note_stem_rel(note: &NoteRecord) -> String {
    note.path
        .strip_prefix("notes/")
        .unwrap_or(&note.path)
        .strip_suffix(".md")
        .unwrap_or(&note.path)
        .to_string()
}

fn folder_path_for_id(root: &Path, id: &str) -> Option<PathBuf> {
    if let Some(rel) = rel_from_folder_id(id) {
        return Some(root.join("notes").join(rel));
    }

    let mut dirs = Vec::new();
    walk_dirs(&root.join("notes"), &mut dirs).ok()?;
    dirs.into_iter().find(|dir| {
        let raw = fs::read_to_string(dir.join(FOLDER_META_FILE)).ok();
        raw.and_then(|value| split_frontmatter::<FolderFrontmatter>(&value).map(|(meta, _)| meta))
            .and_then(|meta| meta.id)
            .is_some_and(|value| value == id)
    })
}

fn folder_rel_for_parent(
    root: &Path,
    manifest: &WorkspaceManifest,
    parent_id: Option<&str>,
) -> String {
    let Some(parent_id) = parent_id else {
        return String::new();
    };

    if let Some(folder_path) = folder_path_for_id(root, parent_id) {
        return folder_path
            .strip_prefix(root.join("notes"))
            .map(|value| value.to_string_lossy().trim_matches('/').to_string())
            .unwrap_or_default();
    }

    manifest
        .notes
        .iter()
        .find(|note| note.id == parent_id)
        .map(note_stem_rel)
        .unwrap_or_default()
}

fn write_note_file(root: &Path, record: &NoteRecord, content: &str) -> Result<(), String> {
    let meta = NoteFrontmatterOut {
        id: record.id.clone(),
        title: record.title.clone(),
        folder_id: record.folder_id.clone(),
        parent_id: record.parent_id.clone(),
        tags: record.tags.clone(),
        pinned: record.pinned,
        created_at: record.created_at,
        updated_at: record.updated_at,
    };
    let raw = write_frontmatter(&meta, content)?;
    let path = root.join(&record.path);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create note directory: {e}"))?;
    }
    fs::write(&path, raw).map_err(|e| format!("Failed to write note file: {e}"))
}

fn read_note_file(
    root: &Path,
    path: &Path,
    notes_by_stem: &HashMap<String, String>,
    note_ids_by_path: &HashMap<String, String>,
) -> Result<NoteDocument, String> {
    let raw = read_to_string(path)?;
    let timestamp = now();
    let rel_path = relative_path(root, path)?;
    let dir_rel = path
        .parent()
        .and_then(|parent| parent.strip_prefix(root.join("notes")).ok())
        .map(|value| value.to_string_lossy().trim_matches('/').to_string())
        .unwrap_or_default();
    let derived_parent_id = notes_by_stem.get(&dir_rel).cloned();
    let derived_folder_id = if derived_parent_id.is_some() || dir_rel.is_empty() {
        None
    } else {
        Some(folder_id_from_rel(&dir_rel))
    };
    let fallback_title = title_from_file(path);

    let (frontmatter, content, has_frontmatter) =
        if let Some((frontmatter, content)) = split_frontmatter::<NoteFrontmatter>(&raw) {
            (frontmatter, content, true)
        } else {
            (NoteFrontmatter::default(), raw, false)
        };

    let created_at = frontmatter.created_at.unwrap_or(timestamp);
    let record = NoteRecord {
        id: frontmatter
            .id
            .or_else(|| note_ids_by_path.get(&rel_path).cloned())
            .unwrap_or_else(|| Uuid::new_v4().to_string()),
        title: frontmatter
            .title
            .filter(|value| !value.trim().is_empty())
            .unwrap_or(fallback_title),
        path: rel_path,
        folder_id: frontmatter.folder_id.or(derived_folder_id),
        parent_id: frontmatter.parent_id.or(derived_parent_id),
        tags: frontmatter.tags.unwrap_or_default(),
        pinned: frontmatter.pinned.unwrap_or(false),
        created_at,
        updated_at: frontmatter.updated_at.unwrap_or(created_at),
    };

    if !has_frontmatter {
        write_note_file(root, &record, &content)?;
    }

    Ok(NoteDocument {
        meta: record,
        content,
    })
}

fn write_folder_meta(root: &Path, folder: &FolderRecord) -> Result<(), String> {
    let folder_path = folder_path_for_id(root, &folder.id)
        .unwrap_or_else(|| root.join("notes").join(slugify(&folder.name)))
        .to_path_buf();
    write_folder_meta_at(&folder_path, folder)
}

fn write_folder_meta_at(folder_path: &Path, folder: &FolderRecord) -> Result<(), String> {
    let path = folder_path.join(FOLDER_META_FILE);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create folder: {e}"))?;
    }
    let raw = write_frontmatter(
        &FolderFrontmatterOut {
            id: folder.id.clone(),
            name: folder.name.clone(),
            parent_id: folder.parent_id.clone(),
            created_at: folder.created_at,
            updated_at: folder.updated_at,
        },
        "",
    )?;
    fs::write(path, raw).map_err(|e| format!("Failed to write folder metadata: {e}"))
}

fn write_sticky_file(root: &Path, record: &StickyRecord, content: &str) -> Result<(), String> {
    let raw = write_frontmatter(
        &StickyFrontmatterOut {
            id: record.id.clone(),
            color: record.color.clone(),
            created_at: record.created_at,
            updated_at: record.updated_at,
        },
        content,
    )?;
    let path = root.join(&record.path);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create stickies: {e}"))?;
    }
    fs::write(path, raw).map_err(|e| format!("Failed to write sticky file: {e}"))
}

fn read_sticky_file(root: &Path, path: &Path) -> Result<StickyRecord, String> {
    let raw = read_to_string(path)?;
    let timestamp = now();
    let rel_path = relative_path(root, path)?;
    let fallback_id = path
        .file_stem()
        .and_then(|value| value.to_str())
        .map(|value| value.trim_start_matches("sticky-").to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| Uuid::new_v4().to_string());
    let (frontmatter, content, has_frontmatter) =
        if let Some((frontmatter, content)) = split_frontmatter::<StickyFrontmatter>(&raw) {
            (frontmatter, content, true)
        } else {
            (StickyFrontmatter::default(), raw, false)
        };
    let created_at = frontmatter.created_at.unwrap_or(timestamp);
    let record = StickyRecord {
        id: frontmatter.id.unwrap_or(fallback_id),
        path: rel_path,
        content,
        color: frontmatter.color.unwrap_or_else(|| "butter".to_string()),
        created_at,
        updated_at: frontmatter.updated_at.unwrap_or(created_at),
    };
    if !has_frontmatter {
        write_sticky_file(root, &record, &record.content)?;
    }
    Ok(record)
}

fn write_bookmark_file(root: &Path, record: &BookmarkRecord) -> Result<(), String> {
    let raw = write_frontmatter(
        &BookmarkFrontmatterOut {
            id: record.id.clone(),
            title: record.title.clone(),
            url: record.url.clone(),
            folder_id: record.folder_id.clone(),
            tags: record.tags.clone(),
            created_at: record.created_at,
            updated_at: record.updated_at,
        },
        "",
    )?;
    let path = root.join(bookmark_path(&record.id, &record.title));
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create bookmarks: {e}"))?;
    }
    fs::write(path, raw).map_err(|e| format!("Failed to write bookmark file: {e}"))
}

fn read_bookmark_file(_root: &Path, path: &Path) -> Result<Option<BookmarkRecord>, String> {
    let raw = read_to_string(path)?;
    let timestamp = now();
    let Some((frontmatter, _)) = split_frontmatter::<BookmarkFrontmatter>(&raw) else {
        return Ok(None);
    };
    let Some(url) = frontmatter.url.filter(|value| !value.trim().is_empty()) else {
        return Ok(None);
    };
    let created_at = frontmatter.created_at.unwrap_or(timestamp);
    Ok(Some(BookmarkRecord {
        id: frontmatter.id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        title: frontmatter
            .title
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| title_from_file(path)),
        url,
        folder_id: frontmatter.folder_id,
        tags: frontmatter.tags.unwrap_or_default(),
        created_at,
        updated_at: frontmatter.updated_at.unwrap_or(created_at),
    }))
}

fn scan_notes(root: &Path) -> Result<Vec<NoteDocument>, String> {
    let mut paths = Vec::new();
    walk_files(&root.join("notes"), &mut paths)?;
    paths.retain(|path| {
        path.extension().and_then(|value| value.to_str()) == Some("md")
            && path.file_name().and_then(|value| value.to_str()) != Some(FOLDER_META_FILE)
    });
    paths.sort();

    let mut stems = HashMap::new();
    let mut ids_by_path = HashMap::new();
    for path in &paths {
        let rel = relative_path(root, path)?;
        let raw = read_to_string(path)?;
        let id = split_frontmatter::<NoteFrontmatter>(&raw)
            .and_then(|(meta, _)| meta.id)
            .unwrap_or_else(|| Uuid::new_v4().to_string());
        ids_by_path.insert(rel.clone(), id.clone());
        stems.insert(
            rel.strip_prefix("notes/")
                .unwrap_or(&rel)
                .strip_suffix(".md")
                .unwrap_or(&rel)
                .to_string(),
            id,
        );
    }

    let mut documents = Vec::new();
    for path in &paths {
        let document = read_note_file(root, path, &stems, &ids_by_path)?;
        documents.push(document);
    }

    documents.sort_by(|a, b| {
        b.meta
            .pinned
            .cmp(&a.meta.pinned)
            .then_with(|| a.meta.path.cmp(&b.meta.path))
    });
    Ok(documents)
}

fn scan_folders(root: &Path, notes: &[NoteRecord]) -> Result<Vec<FolderRecord>, String> {
    let note_namespace_dirs = notes.iter().map(note_stem_rel).collect::<HashSet<_>>();
    let note_id_by_namespace = notes
        .iter()
        .map(|note| (note_stem_rel(note), note.id.clone()))
        .collect::<HashMap<_, _>>();
    let mut dirs = Vec::new();
    walk_dirs(&root.join("notes"), &mut dirs)?;
    dirs.sort();

    let mut folders = Vec::new();
    let timestamp = now();
    for dir in dirs {
        let rel = dir
            .strip_prefix(root.join("notes"))
            .map(|value| value.to_string_lossy().trim_matches('/').to_string())
            .unwrap_or_default();
        if rel.is_empty() || note_namespace_dirs.contains(&rel) {
            continue;
        }

        let meta_path = dir.join(FOLDER_META_FILE);
        let meta = fs::read_to_string(&meta_path)
            .ok()
            .and_then(|raw| split_frontmatter::<FolderFrontmatter>(&raw).map(|(meta, _)| meta));
        let parent_rel = Path::new(&rel)
            .parent()
            .map(|value| value.to_string_lossy().trim_matches('/').to_string())
            .filter(|value| !value.is_empty());
        let derived_parent = parent_rel
            .as_ref()
            .and_then(|value| note_id_by_namespace.get(value).cloned())
            .or_else(|| parent_rel.map(|value| folder_id_from_rel(&value)));
        let created_at = meta
            .as_ref()
            .and_then(|value| value.created_at)
            .unwrap_or(timestamp);
        let name = meta
            .as_ref()
            .and_then(|value| value.name.clone())
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| {
                dir.file_name()
                    .and_then(|value| value.to_str())
                    .unwrap_or("Folder")
                    .to_string()
            });
        folders.push(FolderRecord {
            id: meta
                .as_ref()
                .and_then(|value| value.id.clone())
                .unwrap_or_else(|| folder_id_from_rel(&rel)),
            name,
            parent_id: meta
                .as_ref()
                .and_then(|value| value.parent_id.clone())
                .or(derived_parent),
            created_at,
            updated_at: meta
                .as_ref()
                .and_then(|value| value.updated_at)
                .unwrap_or(created_at),
        });
    }

    Ok(folders)
}

fn scan_workspace(root: &Path) -> Result<WorkspaceManifest, String> {
    let note_documents = scan_notes(root)?;
    let notes = note_documents
        .into_iter()
        .map(|document| document.meta)
        .collect::<Vec<_>>();
    let folders = scan_folders(root, &notes)?;

    let mut sticky_paths = Vec::new();
    walk_files(&root.join("stickies"), &mut sticky_paths)?;
    sticky_paths.retain(|path| path.extension().and_then(|value| value.to_str()) == Some("md"));
    sticky_paths.sort();
    let mut stickies = sticky_paths
        .iter()
        .map(|path| read_sticky_file(root, path))
        .collect::<Result<Vec<_>, _>>()?;
    stickies.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    let mut bookmark_paths = Vec::new();
    walk_files(&root.join("bookmarks"), &mut bookmark_paths)?;
    bookmark_paths.retain(|path| path.extension().and_then(|value| value.to_str()) == Some("md"));
    bookmark_paths.sort();
    let mut bookmarks = bookmark_paths
        .iter()
        .filter_map(|path| read_bookmark_file(root, path).transpose())
        .collect::<Result<Vec<_>, _>>()?;
    bookmarks.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));

    let timestamps = notes
        .iter()
        .map(|note| note.updated_at)
        .chain(folders.iter().map(|folder| folder.updated_at))
        .chain(stickies.iter().map(|sticky| sticky.updated_at))
        .chain(bookmarks.iter().map(|bookmark| bookmark.updated_at))
        .collect::<Vec<_>>();
    let created_at = timestamps.iter().min().copied().unwrap_or_else(now);
    let updated_at = timestamps.iter().max().copied().unwrap_or(created_at);

    Ok(WorkspaceManifest {
        version: 2,
        workspace_id: "filesystem".to_string(),
        name: "Draft Workspace".to_string(),
        created_at,
        updated_at,
        folders,
        notes,
        stickies,
        bookmarks,
    })
}

fn migrate_legacy_manifest(root: &Path) -> Result<(), String> {
    let path = root.join(LEGACY_MANIFEST_FILE);
    if !path.exists() {
        return Ok(());
    }

    let raw = read_to_string(&path)?;
    let manifest: WorkspaceManifest =
        serde_json::from_str(&raw).map_err(|e| format!("Failed to parse legacy manifest: {e}"))?;
    let folder_by_id = manifest
        .folders
        .iter()
        .map(|folder| (folder.id.clone(), folder.clone()))
        .collect::<HashMap<_, _>>();
    let mut folder_rel_by_id = HashMap::new();

    fn folder_rel(
        id: &str,
        folder_by_id: &HashMap<String, FolderRecord>,
        cache: &mut HashMap<String, String>,
    ) -> String {
        if let Some(value) = cache.get(id) {
            return value.clone();
        }
        let Some(folder) = folder_by_id.get(id) else {
            return String::new();
        };
        let parent = folder
            .parent_id
            .as_ref()
            .map(|parent_id| folder_rel(parent_id, folder_by_id, cache))
            .unwrap_or_default();
        let rel = if parent.is_empty() {
            slugify(&folder.name)
        } else {
            format!("{}/{}", parent, slugify(&folder.name))
        };
        cache.insert(id.to_string(), rel.clone());
        rel
    }

    for folder in &manifest.folders {
        let rel = folder_rel(&folder.id, &folder_by_id, &mut folder_rel_by_id);
        let next_id = folder_id_from_rel(&rel);
        let parent_id = folder
            .parent_id
            .as_ref()
            .and_then(|id| folder_rel_by_id.get(id))
            .map(|rel| folder_id_from_rel(rel));
        let record = FolderRecord {
            id: next_id,
            name: folder.name.clone(),
            parent_id,
            created_at: folder.created_at,
            updated_at: folder.updated_at,
        };
        fs::create_dir_all(root.join("notes").join(&rel))
            .map_err(|e| format!("Failed to migrate folder: {e}"))?;
        write_folder_meta(root, &record)?;
    }

    for note in &manifest.notes {
        let (_, content, _) = {
            let old_path = root.join(&note.path);
            if old_path.exists() {
                let raw = read_to_string(&old_path)?;
                if let Some((meta, body)) = split_frontmatter::<NoteFrontmatter>(&raw) {
                    (meta, body, true)
                } else {
                    (NoteFrontmatter::default(), raw, false)
                }
            } else {
                (NoteFrontmatter::default(), String::new(), false)
            }
        };
        let base = note
            .folder_id
            .as_ref()
            .and_then(|id| folder_rel_by_id.get(id).cloned())
            .unwrap_or_default();
        let new_folder_id = if base.is_empty() {
            None
        } else {
            Some(folder_id_from_rel(&base))
        };
        let record = NoteRecord {
            id: note.id.clone(),
            title: note.title.clone(),
            path: note_path_in(&base, &note.id, &note.title),
            folder_id: new_folder_id,
            parent_id: note.parent_id.clone(),
            tags: note.tags.clone(),
            pinned: note.pinned,
            created_at: note.created_at,
            updated_at: note.updated_at,
        };
        write_note_file(root, &record, &content)?;
        if note.path != record.path {
            let _ = fs::remove_file(root.join(&note.path));
        }
    }

    for sticky in &manifest.stickies {
        let path = if sticky.path.is_empty() {
            sticky_path(&sticky.id)
        } else {
            sticky.path.clone()
        };
        let record = StickyRecord {
            path,
            ..sticky.clone()
        };
        write_sticky_file(root, &record, &sticky.content)?;
    }

    for bookmark in &manifest.bookmarks {
        let mut record = bookmark.clone();
        record.folder_id = record
            .folder_id
            .as_ref()
            .and_then(|id| folder_rel_by_id.get(id))
            .map(|rel| folder_id_from_rel(rel));
        write_bookmark_file(root, &record)?;
    }

    fs::remove_file(path).map_err(|e| format!("Failed to remove legacy manifest: {e}"))?;
    Ok(())
}

fn ensure_workspace() -> Result<(PathBuf, WorkspaceManifest), String> {
    let root = workspace_root()?;
    ensure_dirs(&root)?;
    migrate_legacy_manifest(&root)?;

    let mut manifest = scan_workspace(&root)?;
    if manifest.notes.is_empty() {
        let timestamp = now();
        let folder_rel = "writing";
        let folder = FolderRecord {
            id: folder_id_from_rel(folder_rel),
            name: "Writing".to_string(),
            parent_id: None,
            created_at: timestamp,
            updated_at: timestamp,
        };
        fs::create_dir_all(root.join("notes").join(folder_rel))
            .map_err(|e| format!("Failed to create welcome folder: {e}"))?;
        write_folder_meta(&root, &folder)?;

        let note_id = Uuid::new_v4().to_string();
        let note = NoteRecord {
            id: note_id.clone(),
            title: "Welcome to Draft".to_string(),
            path: note_path_in(folder_rel, &note_id, "Welcome to Draft"),
            folder_id: Some(folder.id.clone()),
            parent_id: None,
            tags: vec!["start".to_string()],
            pinned: true,
            created_at: timestamp,
            updated_at: timestamp,
        };
        write_note_file(
            &root,
            &note,
            "This is a file-first writing workspace.\n\n- [ ] Capture ideas quickly\n- [ ] Organize notes into folders and nested files\n- [ ] Let AI agents read and update the workspace safely\n\n```agent-access\nDocuments/Draft/Workspace\n```\n",
        )?;

        let sticky_id = Uuid::new_v4().to_string();
        let sticky = StickyRecord {
            id: sticky_id.clone(),
            path: sticky_path(&sticky_id),
            content: "Everything in this workspace is plain files. Agents can edit notes directly in Documents/Draft/Workspace.".to_string(),
            color: "mint".to_string(),
            created_at: timestamp,
            updated_at: timestamp,
        };
        write_sticky_file(&root, &sticky, &sticky.content)?;

        let bookmark = BookmarkRecord {
            id: Uuid::new_v4().to_string(),
            title: "beUI motion reference".to_string(),
            url: "https://beui.saura3h.xyz".to_string(),
            folder_id: Some(folder.id),
            tags: vec!["ui".to_string(), "motion".to_string()],
            created_at: timestamp,
            updated_at: timestamp,
        };
        write_bookmark_file(&root, &bookmark)?;
        manifest = scan_workspace(&root)?;
    }

    Ok((root, manifest))
}

fn get_note_document(
    root: &Path,
    manifest: &WorkspaceManifest,
    id: &str,
) -> Result<Option<NoteDocument>, String> {
    let Some(note) = manifest.notes.iter().find(|note| note.id == id) else {
        return Ok(None);
    };
    let raw = read_to_string(&root.join(&note.path))?;
    let content = split_frontmatter::<NoteFrontmatter>(&raw)
        .map(|(_, body)| body)
        .unwrap_or(raw);
    Ok(Some(NoteDocument {
        meta: note.clone(),
        content,
    }))
}

fn note_base_rel(
    root: &Path,
    manifest: &WorkspaceManifest,
    folder_id: Option<&str>,
    parent_id: Option<&str>,
) -> String {
    if let Some(parent_id) = parent_id {
        if let Some(parent) = manifest.notes.iter().find(|note| note.id == parent_id) {
            return note_stem_rel(parent);
        }
    }
    folder_id
        .and_then(|id| folder_path_for_id(root, id))
        .and_then(|path| {
            path.strip_prefix(root.join("notes"))
                .ok()
                .map(|value| value.to_path_buf())
        })
        .map(|value| value.to_string_lossy().trim_matches('/').to_string())
        .unwrap_or_default()
}

#[tauri::command]
fn load_workspace() -> Result<WorkspaceSnapshot, String> {
    let (root, manifest) = ensure_workspace()?;
    let active_note = manifest
        .notes
        .first()
        .map(|note| get_note_document(&root, &manifest, &note.id))
        .transpose()?
        .flatten();

    Ok(WorkspaceSnapshot {
        root_path: root.to_string_lossy().to_string(),
        manifest,
        active_note,
    })
}

#[tauri::command]
fn get_note(id: String) -> Result<Option<NoteDocument>, String> {
    let (root, manifest) = ensure_workspace()?;
    get_note_document(&root, &manifest, &id)
}

#[tauri::command]
fn upsert_note(input: UpsertNoteRequest) -> Result<NoteDocument, String> {
    let (root, manifest) = ensure_workspace()?;
    let timestamp = now();
    let id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let existing = manifest.notes.iter().find(|note| note.id == id).cloned();
    let base = note_base_rel(
        &root,
        &manifest,
        input.folder_id.as_deref(),
        input.parent_id.as_deref(),
    );
    let path = note_path_in(&base, &id, &input.title);
    let record = NoteRecord {
        id: id.clone(),
        title: input.title,
        path: path.clone(),
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
    if let Some(existing) = existing {
        if existing.path != path {
            let _ = fs::remove_file(root.join(existing.path));
        }
    }
    Ok(NoteDocument {
        meta: record,
        content: input.content,
    })
}

#[tauri::command]
fn delete_note(id: String) -> Result<WorkspaceManifest, String> {
    let (root, manifest) = ensure_workspace()?;
    if let Some(note) = manifest.notes.iter().find(|note| note.id == id) {
        let _ = fs::remove_file(root.join(&note.path));
        let child_dir = root.join("notes").join(note_stem_rel(note));
        if child_dir.exists() {
            let _ = fs::remove_dir_all(child_dir);
        }
    }
    scan_workspace(&root)
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
    let (root, manifest) = ensure_workspace()?;
    let mut ids = Vec::new();
    collect_child_folder_ids(&manifest, &id, &mut ids);
    if let Some(path) = folder_path_for_id(&root, &id) {
        let _ = fs::remove_dir_all(path);
    }
    for bookmark in manifest.bookmarks.iter().filter(|bookmark| {
        bookmark
            .folder_id
            .as_ref()
            .is_some_and(|folder_id| ids.contains(folder_id))
    }) {
        let _ = fs::remove_file(root.join(bookmark_path(&bookmark.id, &bookmark.title)));
    }
    scan_workspace(&root)
}

#[tauri::command]
fn upsert_folder(input: UpsertFolderRequest) -> Result<FolderRecord, String> {
    let (root, manifest) = ensure_workspace()?;
    let timestamp = now();
    let existing = input.id.as_ref().and_then(|id| {
        manifest
            .folders
            .iter()
            .find(|folder| folder.id == *id)
            .cloned()
    });
    let parent_rel = folder_rel_for_parent(&root, &manifest, input.parent_id.as_deref());
    let next_rel = if parent_rel.is_empty() {
        slugify(&input.name)
    } else {
        format!("{}/{}", parent_rel, slugify(&input.name))
    };
    let id = existing
        .as_ref()
        .map(|folder| folder.id.clone())
        .unwrap_or_else(|| folder_id_from_rel(&next_rel));
    let old_path = existing
        .as_ref()
        .and_then(|folder| folder_path_for_id(&root, &folder.id));
    let new_path = root.join("notes").join(&next_rel);
    if let Some(old_path) = old_path {
        if old_path != new_path && old_path.exists() {
            if let Some(parent) = new_path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create folder parent: {e}"))?;
            }
            fs::rename(&old_path, &new_path)
                .map_err(|e| format!("Failed to rename folder: {e}"))?;
        }
    } else {
        fs::create_dir_all(&new_path).map_err(|e| format!("Failed to create folder: {e}"))?;
    }
    let folder = FolderRecord {
        id,
        name: input.name,
        parent_id: input.parent_id,
        created_at: existing
            .map(|folder| folder.created_at)
            .unwrap_or(timestamp),
        updated_at: timestamp,
    };
    write_folder_meta_at(&new_path, &folder)?;
    Ok(folder)
}

#[tauri::command]
fn upsert_sticky(input: UpsertStickyRequest) -> Result<StickyRecord, String> {
    let (root, manifest) = ensure_workspace()?;
    let timestamp = now();
    let id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let existing = manifest
        .stickies
        .iter()
        .find(|sticky| sticky.id == id)
        .cloned();
    let record = StickyRecord {
        id: id.clone(),
        path: existing
            .as_ref()
            .map(|sticky| sticky.path.clone())
            .unwrap_or_else(|| sticky_path(&id)),
        content: input.content.clone(),
        color: input.color,
        created_at: existing
            .map(|sticky| sticky.created_at)
            .unwrap_or(timestamp),
        updated_at: timestamp,
    };
    write_sticky_file(&root, &record, &input.content)?;
    Ok(record)
}

#[tauri::command]
fn delete_sticky(id: String) -> Result<WorkspaceManifest, String> {
    let (root, manifest) = ensure_workspace()?;
    if let Some(sticky) = manifest.stickies.iter().find(|sticky| sticky.id == id) {
        let _ = fs::remove_file(root.join(&sticky.path));
    }
    scan_workspace(&root)
}

#[tauri::command]
fn upsert_bookmark(input: UpsertBookmarkRequest) -> Result<BookmarkRecord, String> {
    let (root, manifest) = ensure_workspace()?;
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
            .as_ref()
            .map(|bookmark| bookmark.created_at)
            .unwrap_or(timestamp),
        updated_at: timestamp,
    };
    write_bookmark_file(&root, &record)?;
    if let Some(existing) = existing {
        let old_path = root.join(bookmark_path(&existing.id, &existing.title));
        let new_path = root.join(bookmark_path(&record.id, &record.title));
        if old_path != new_path {
            let _ = fs::remove_file(old_path);
        }
    }
    Ok(record)
}

#[tauri::command]
fn delete_bookmark(id: String) -> Result<WorkspaceManifest, String> {
    let (root, manifest) = ensure_workspace()?;
    if let Some(bookmark) = manifest.bookmarks.iter().find(|bookmark| bookmark.id == id) {
        let _ = fs::remove_file(root.join(bookmark_path(&bookmark.id, &bookmark.title)));
    }
    scan_workspace(&root)
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

#[tauri::command]
fn save_image_asset(input: SaveImageAssetRequest) -> Result<String, String> {
    let (root, _) = ensure_workspace()?;
    let source = PathBuf::from(&input.file_name);
    let relative_path = asset_path(&source);
    let destination = root.join(&relative_path);
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create assets: {e}"))?;
    }
    fs::write(&destination, input.bytes).map_err(|e| format!("Failed to save image: {e}"))?;

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
            save_image_asset,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
