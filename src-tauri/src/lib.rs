mod commands;
mod models;
mod services;
mod state;

use state::AppState;
use commands::notes::*;
use commands::folders::*;
use commands::search::*;
use commands::export::*;
use commands::sticky_notes::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState::new().expect("Failed to initialize app state");
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // Note commands
            create_note,
            get_note,
            update_note,
            delete_note,
            list_notes,
            save_note_content,
            import_file,
            toggle_note_pinned,
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
            // Sticky Notes commands
            create_sticky_note,
            get_sticky_note,
            update_sticky_note,
            delete_sticky_note,
            list_sticky_notes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
