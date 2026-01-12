pub mod commands;
pub mod models;
pub mod services;
pub mod state;
pub mod utils;

use commands::app::*;
use commands::bookmarks::*;
use commands::export::*;
use commands::folders::*;
use commands::notes::*;
use commands::page_links::*;
use commands::search::*;
use commands::sticky_notes::*;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = match AppState::new() {
        Ok(state) => state,
        Err(e) => {
            eprintln!("Failed to initialize app state: {}", e);
            eprintln!("This is usually caused by:");
            eprintln!("  - Missing Documents directory");
            eprintln!("  - Database file corruption");
            eprintln!("  - Insufficient permissions");
            std::process::exit(1);
        }
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // App commands
            get_app_version,
            // Note commands
            create_note,
            get_note,
            update_note,
            delete_note,
            list_notes,
            save_note_content,
            import_file,
            toggle_note_pinned,
            // Page hierarchy commands
            create_subpage,
            get_page_children,
            move_page,
            // Folder commands
            create_folder,
            get_folder,
            update_folder,
            delete_folder,
            list_folders,
            move_note_to_folder,
            // Search commands
            search_notes,
            // Export commands
            export_note,
            get_note_content_for_export,
            // Page linking commands
            link_page,
            unlink_page,
            get_linked_pages,
            get_backlinks,
            sync_page_links,
            update_page_link_titles,
            // Sticky Notes commands
            create_sticky_note,
            get_sticky_note,
            update_sticky_note,
            delete_sticky_note,
            list_sticky_notes,
            // Bookmark commands
            create_bookmark,
            get_bookmark,
            update_bookmark,
            delete_bookmark,
            list_bookmarks,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
