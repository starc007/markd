mod agent_docs;
mod assets;
mod backlink_links;
mod backlinks;
mod bookmarks;
mod commands;
mod config;
mod error;
mod link_meta;
mod notes;
mod search;
mod todos;
mod util;
mod vault;

use commands::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::startup,
            commands::choose_vault,
            commands::create_vault,
            commands::load_tree,
            commands::read_note,
            commands::write_note,
            commands::create_note,
            commands::create_folder,
            commands::rename_entry,
            commands::move_entry,
            commands::delete_entry,
            commands::search_notes,
            commands::backlinks_for,
            commands::todos_list,
            commands::todo_add,
            commands::todo_toggle,
            commands::todo_update,
            commands::todo_set_tags,
            commands::todo_tags_list,
            commands::todo_tag_create,
            commands::todo_tag_delete,
            commands::todo_delete,
            commands::todos_clear_completed,
            commands::bookmarks_list,
            commands::bookmark_add,
            commands::bookmark_update_title,
            commands::bookmark_set_tags,
            commands::bookmark_tags_list,
            commands::bookmark_tag_create,
            commands::bookmark_tag_delete,
            commands::bookmark_delete,
            commands::bookmark_fetch_meta,
            commands::export_bookmarks,
            commands::export_note,
            commands::save_image_asset,
            commands::set_theme,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
