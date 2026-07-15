use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{AppHandle, Emitter, Manager, PhysicalPosition};

use crate::error::{AppError, AppResult};

pub const WINDOW_LABEL: &str = "quick-capture";
pub const OPEN_EVENT: &str = "markd:quick-capture-open";
static MAIN_WAS_FOCUSED: AtomicBool = AtomicBool::new(false);

/// Show the compact capture window on the monitor under the pointer. The main
/// Markd window is deliberately left untouched so capture works over any app.
pub fn show(app: &AppHandle) -> AppResult<()> {
    let main = app.get_webview_window("main");
    let main_was_focused = main
        .as_ref()
        .and_then(|window| window.is_focused().ok())
        .unwrap_or(false);
    MAIN_WAS_FOCUSED.store(main_was_focused, Ordering::Relaxed);

    // An app-level hide preserves each window's visible state. Hide the main
    // window before unhiding Markd so repeated captures only reveal the panel.
    #[cfg(target_os = "macos")]
    if !main_was_focused {
        if let Some(main) = &main {
            let _ = main.hide();
        }
    }

    let window = app
        .get_webview_window(WINDOW_LABEL)
        .ok_or_else(|| AppError::NotFound("Quick Capture window".to_string()))?;

    #[cfg(target_os = "macos")]
    app.show()
        .map_err(|error| AppError::Other(error.to_string()))?;

    position_on_active_monitor(app, &window);
    window
        .show()
        .map_err(|error| AppError::Other(error.to_string()))?;
    let _ = window.emit(OPEN_EVENT, ());
    window
        .set_focus()
        .map_err(|error| AppError::Other(error.to_string()))?;
    Ok(())
}

/// Close capture without promoting Markd's main window when capture was
/// opened over another application.
pub fn close(app: &AppHandle) -> AppResult<()> {
    let window = app
        .get_webview_window(WINDOW_LABEL)
        .ok_or_else(|| AppError::NotFound("Quick Capture window".to_string()))?;
    window
        .hide()
        .map_err(|error| AppError::Other(error.to_string()))?;

    let main_was_focused = MAIN_WAS_FOCUSED.swap(false, Ordering::Relaxed);

    #[cfg(target_os = "macos")]
    if !main_was_focused {
        // Keep the main window logically visible while the application is
        // hidden so opening Markd normally still restores the workspace.
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.show();
        }
        app.hide()
            .map_err(|error| AppError::Other(error.to_string()))?;
    }

    if main_was_focused {
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.set_focus();
        }
    }

    Ok(())
}

fn position_on_active_monitor(app: &AppHandle, window: &tauri::WebviewWindow) {
    let Ok(cursor) = app.cursor_position() else {
        let _ = window.center();
        return;
    };
    let Ok(Some(monitor)) = app.monitor_from_point(cursor.x, cursor.y) else {
        let _ = window.center();
        return;
    };
    let Ok(size) = window.outer_size() else {
        let _ = window.center();
        return;
    };

    let work = monitor.work_area();
    let available_x = work.size.width.saturating_sub(size.width) as i32;
    let available_y = work.size.height.saturating_sub(size.height) as i32;
    let x = work.position.x + available_x / 2;
    // Slightly above center keeps the panel close to the user's reading area.
    let y = work.position.y + (available_y * 2 / 5);
    let _ = window.set_position(PhysicalPosition::new(x, y));
}
