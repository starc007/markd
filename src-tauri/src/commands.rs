use std::path::PathBuf;
use std::sync::RwLock;

use serde::Serialize;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_dialog::DialogExt;

use crate::backlinks::{self, BacklinkMention};
use crate::bookmarks::{self, Bookmark};
use crate::config::{self, Theme};
use crate::error::{AppError, AppResult};
use crate::search::SearchHit;
use crate::todos::{self, Todo};
use crate::vault::{self, TreeNode};
use crate::{agent_docs, assets, daily_notes, link_meta, notes, pins, quick_capture, search};

#[derive(Default)]
pub struct AppState {
    vault: RwLock<Option<PathBuf>>,
}

impl AppState {
    fn root(&self) -> AppResult<PathBuf> {
        self.vault
            .read()
            .map_err(|_| AppError::Other("state lock poisoned".to_string()))?
            .clone()
            .ok_or(AppError::NoVault)
    }

    fn set_root(&self, path: Option<PathBuf>) {
        if let Ok(mut guard) = self.vault.write() {
            *guard = path;
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultSnapshot {
    pub root: String,
    pub name: String,
    pub tree: Vec<TreeNode>,
    pub theme: Theme,
}

fn snapshot(app: &AppHandle, root: &PathBuf) -> AppResult<VaultSnapshot> {
    let tree = vault::scan_tree(root)?;
    let name = root
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Vault".to_string());
    Ok(VaultSnapshot {
        root: root.display().to_string(),
        name,
        tree,
        theme: config::load(app).theme,
    })
}

fn activate_vault(app: &AppHandle, state: &AppState, root: PathBuf) -> AppResult<VaultSnapshot> {
    // First run = Markd has never set this folder up (no .markd yet).
    let first_run = !root.join(vault::DATA_DIR).exists();
    vault::ensure_layout(&root)?;
    // Drop in agent guide files so coding agents understand the vault.
    let _ = agent_docs::ensure(&root);
    // Seed a starter note only on a brand-new vault, so it isn't empty.
    if first_run {
        let _ = notes::seed_welcome(&root);
    }
    // Allow the webview to load images from the vault's asset folder.
    let _ = app
        .asset_protocol_scope()
        .allow_directory(root.join(vault::ASSETS_DIR), true);
    state.set_root(Some(root.clone()));
    let mut cfg = config::load(app);
    cfg.vault_path = Some(root.display().to_string());
    config::save(app, &cfg)?;
    snapshot(app, &root)
}

/// Called once on app start: reopen the last vault if it still exists.
#[tauri::command]
pub fn startup(app: AppHandle, state: State<'_, AppState>) -> AppResult<Option<VaultSnapshot>> {
    let cfg = config::load(&app);
    let Some(path) = cfg.vault_path else {
        return Ok(None);
    };
    let root = PathBuf::from(path);
    if !root.is_dir() {
        return Ok(None);
    }
    activate_vault(&app, &state, root).map(Some)
}

/// Open a native folder picker and activate the chosen folder as the vault.
/// Async so the blocking dialog call runs off the main thread — calling it
/// on the main thread deadlocks the whole app.
#[tauri::command]
pub async fn choose_vault(
    app: AppHandle,
    state: State<'_, AppState>,
) -> AppResult<Option<VaultSnapshot>> {
    let picked = tauri::async_runtime::spawn_blocking({
        let app = app.clone();
        move || app.dialog().file().blocking_pick_folder()
    })
    .await
    .map_err(|e| AppError::Other(e.to_string()))?;

    let Some(folder) = picked else {
        return Ok(None);
    };
    let root = folder
        .into_path()
        .map_err(|e| AppError::InvalidPath(e.to_string()))?;
    activate_vault(&app, &state, root).map(Some)
}

/// Prompt for a location + name, create that folder as a fresh vault, and
/// activate it. Async so the blocking save dialog runs off the main thread.
#[tauri::command]
pub async fn create_vault(
    app: AppHandle,
    state: State<'_, AppState>,
) -> AppResult<Option<VaultSnapshot>> {
    let picked = tauri::async_runtime::spawn_blocking({
        let app = app.clone();
        move || {
            app.dialog()
                .file()
                .set_file_name("Markd Vault")
                .blocking_save_file()
        }
    })
    .await
    .map_err(|e| AppError::Other(e.to_string()))?;

    let Some(dest) = picked else {
        return Ok(None);
    };
    let root = dest
        .into_path()
        .map_err(|e| AppError::InvalidPath(e.to_string()))?;
    std::fs::create_dir_all(&root)?;
    activate_vault(&app, &state, root).map(Some)
}

#[tauri::command]
pub fn load_tree(state: State<'_, AppState>) -> AppResult<Vec<TreeNode>> {
    vault::scan_tree(&state.root()?)
}

// ---- notes ----

#[tauri::command]
pub fn read_note(state: State<'_, AppState>, rel: String) -> AppResult<String> {
    notes::read_note(&state.root()?, &rel)
}

#[tauri::command]
pub fn write_note(state: State<'_, AppState>, rel: String, content: String) -> AppResult<()> {
    notes::write_note(&state.root()?, &rel, &content)
}

#[tauri::command]
pub fn create_note(state: State<'_, AppState>, dir: String, title: String) -> AppResult<String> {
    notes::create_note(&state.root()?, &dir, &title)
}

#[tauri::command]
pub fn create_note_with_content(
    state: State<'_, AppState>,
    dir: String,
    title: String,
    content: String,
) -> AppResult<String> {
    notes::create_note_with_content(&state.root()?, &dir, &title, &content)
}

#[tauri::command]
pub fn open_daily_note(state: State<'_, AppState>, date: String) -> AppResult<String> {
    daily_notes::open_or_create(&state.root()?, &date)
}

#[tauri::command]
pub fn show_quick_capture(app: AppHandle) -> AppResult<()> {
    quick_capture::show(&app)
}

#[tauri::command]
pub fn close_quick_capture(app: AppHandle) -> AppResult<()> {
    quick_capture::close(&app)
}

#[tauri::command]
pub fn create_folder(state: State<'_, AppState>, dir: String, name: String) -> AppResult<String> {
    notes::create_folder(&state.root()?, &dir, &name)
}

#[tauri::command]
pub fn rename_entry(state: State<'_, AppState>, rel: String, name: String) -> AppResult<String> {
    notes::rename_entry(&state.root()?, &rel, &name)
}

#[tauri::command]
pub fn move_entry(state: State<'_, AppState>, rel: String, dir: String) -> AppResult<String> {
    notes::move_entry(&state.root()?, &rel, &dir)
}

#[tauri::command]
pub fn delete_entry(state: State<'_, AppState>, rel: String) -> AppResult<()> {
    notes::delete_entry(&state.root()?, &rel)
}

#[tauri::command]
pub fn search_notes(
    state: State<'_, AppState>,
    query: String,
    limit: Option<usize>,
) -> AppResult<Vec<SearchHit>> {
    search::search_notes(&state.root()?, &query, limit.unwrap_or(30))
}

#[tauri::command]
pub fn backlinks_for(state: State<'_, AppState>, rel: String) -> AppResult<Vec<BacklinkMention>> {
    backlinks::find_backlinks(&state.root()?, &rel)
}

// ---- pins ----

#[tauri::command]
pub fn pins_list(state: State<'_, AppState>) -> AppResult<Vec<String>> {
    pins::list(&state.root()?)
}

#[tauri::command]
pub fn pin_note(state: State<'_, AppState>, rel: String) -> AppResult<Vec<String>> {
    pins::pin(&state.root()?, &rel)
}

#[tauri::command]
pub fn unpin_note(state: State<'_, AppState>, rel: String) -> AppResult<Vec<String>> {
    pins::unpin(&state.root()?, &rel)
}

// ---- todos ----

#[tauri::command]
pub fn todos_list(state: State<'_, AppState>) -> AppResult<Vec<Todo>> {
    todos::list(&state.root()?)
}

#[tauri::command]
pub fn todo_add(state: State<'_, AppState>, text: String) -> AppResult<Todo> {
    todos::add(&state.root()?, &text)
}

#[tauri::command]
pub fn todo_toggle(state: State<'_, AppState>, id: String) -> AppResult<Todo> {
    todos::toggle(&state.root()?, &id)
}

#[tauri::command]
pub fn todo_update(state: State<'_, AppState>, id: String, text: String) -> AppResult<Todo> {
    todos::update_text(&state.root()?, &id, &text)
}

#[tauri::command]
pub fn todo_set_tags(
    state: State<'_, AppState>,
    id: String,
    tags: Vec<String>,
) -> AppResult<Todo> {
    todos::set_tags(&state.root()?, &id, tags)
}

#[tauri::command]
pub fn todo_tags_list(state: State<'_, AppState>) -> AppResult<Vec<String>> {
    todos::list_tags(&state.root()?)
}

#[tauri::command]
pub fn todo_tag_create(
    state: State<'_, AppState>,
    name: String,
) -> AppResult<Vec<String>> {
    todos::create_tag(&state.root()?, &name)
}

#[tauri::command]
pub fn todo_tag_delete(
    state: State<'_, AppState>,
    name: String,
) -> AppResult<Vec<String>> {
    todos::delete_tag(&state.root()?, &name)
}

#[tauri::command]
pub fn todo_delete(state: State<'_, AppState>, id: String) -> AppResult<()> {
    todos::delete(&state.root()?, &id)
}

#[tauri::command]
pub fn todos_clear_completed(state: State<'_, AppState>) -> AppResult<Vec<Todo>> {
    todos::clear_completed(&state.root()?)
}

// ---- bookmarks ----

#[tauri::command]
pub fn bookmarks_list(state: State<'_, AppState>) -> AppResult<Vec<Bookmark>> {
    bookmarks::list(&state.root()?)
}

#[tauri::command]
pub fn bookmark_add(state: State<'_, AppState>, url: String) -> AppResult<Bookmark> {
    bookmarks::add(&state.root()?, &url)
}

#[tauri::command]
pub fn bookmark_update_title(
    state: State<'_, AppState>,
    id: String,
    title: String,
) -> AppResult<Bookmark> {
    bookmarks::update(&state.root()?, &id, Some(title), None, None, None)
}

#[tauri::command]
pub fn bookmark_set_tags(
    state: State<'_, AppState>,
    id: String,
    tags: Vec<String>,
) -> AppResult<Bookmark> {
    bookmarks::set_tags(&state.root()?, &id, tags)
}

#[tauri::command]
pub fn bookmark_tags_list(state: State<'_, AppState>) -> AppResult<Vec<String>> {
    bookmarks::list_tags(&state.root()?)
}

#[tauri::command]
pub fn bookmark_tag_create(
    state: State<'_, AppState>,
    name: String,
) -> AppResult<Vec<String>> {
    bookmarks::create_tag(&state.root()?, &name)
}

#[tauri::command]
pub fn bookmark_tag_delete(
    state: State<'_, AppState>,
    name: String,
) -> AppResult<Vec<String>> {
    bookmarks::delete_tag(&state.root()?, &name)
}

#[tauri::command]
pub fn bookmark_delete(state: State<'_, AppState>, id: String) -> AppResult<()> {
    bookmarks::delete(&state.root()?, &id)
}

/// Export all bookmarks to a markdown file the user picks. Async so the
/// blocking save dialog runs off the main thread. Returns the written path,
/// or None if the user cancelled.
#[tauri::command]
pub async fn export_bookmarks(
    app: AppHandle,
    state: State<'_, AppState>,
) -> AppResult<Option<String>> {
    let markdown = bookmarks::to_markdown(&bookmarks::list(&state.root()?)?);

    let picked = tauri::async_runtime::spawn_blocking({
        let app = app.clone();
        move || {
            app.dialog()
                .file()
                .set_file_name("bookmarks.md")
                .blocking_save_file()
        }
    })
    .await
    .map_err(|e| AppError::Other(e.to_string()))?;

    let Some(dest) = picked else {
        return Ok(None);
    };
    let path = dest
        .into_path()
        .map_err(|e| AppError::InvalidPath(e.to_string()))?;
    std::fs::write(&path, markdown)?;
    Ok(Some(path.display().to_string()))
}

/// Export the current note contents to a markdown file chosen by the user.
/// The frontend supplies its live editor contents so an in-flight autosave
/// cannot make the exported copy stale.
#[tauri::command]
pub async fn export_note(
    app: AppHandle,
    state: State<'_, AppState>,
    rel: String,
    content: String,
) -> AppResult<Option<String>> {
    // Validate that the source note still exists and `rel` stays in the vault.
    notes::read_note(&state.root()?, &rel)?;
    let file_name = PathBuf::from(&rel)
        .file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_else(|| "note.md".to_string());

    let picked = tauri::async_runtime::spawn_blocking({
        let app = app.clone();
        move || {
            app.dialog()
                .file()
                .set_file_name(file_name)
                .blocking_save_file()
        }
    })
    .await
    .map_err(|e| AppError::Other(e.to_string()))?;

    let Some(dest) = picked else {
        return Ok(None);
    };
    let path = dest
        .into_path()
        .map_err(|e| AppError::InvalidPath(e.to_string()))?;
    std::fs::write(&path, content)?;
    Ok(Some(path.display().to_string()))
}

/// Fetch title/preview-image/favicon for a bookmark and persist them.
/// Marks the bookmark as fetched even on failure so the UI can offer retry
/// without hammering the network on every load.
#[tauri::command]
pub async fn bookmark_fetch_meta(
    state: State<'_, AppState>,
    id: String,
) -> AppResult<Bookmark> {
    let root = state.root()?;
    let bookmark = bookmarks::list(&root)?
        .into_iter()
        .find(|b| b.id == id)
        .ok_or_else(|| AppError::NotFound(id.clone()))?;

    match link_meta::fetch(&bookmark.url).await {
        Ok(meta) => bookmarks::update(&root, &id, meta.title, meta.image, meta.favicon, Some(true)),
        Err(_) => bookmarks::update(&root, &id, None, None, None, Some(true)),
    }
}

// ---- assets / misc ----

#[tauri::command]
pub fn save_image_asset(
    state: State<'_, AppState>,
    data: String,
    extension: String,
) -> AppResult<String> {
    let path = assets::save_image(&state.root()?, &data, &extension)?;
    Ok(path.display().to_string())
}

#[tauri::command]
pub fn set_theme(app: AppHandle, theme: Theme) -> AppResult<()> {
    let mut cfg = config::load(&app);
    cfg.theme = theme;
    config::save(&app, &cfg)
}

#[tauri::command]
pub fn get_theme(app: AppHandle) -> Theme {
    config::load(&app).theme
}
