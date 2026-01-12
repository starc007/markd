use serde::{Deserialize, Serialize};
use tauri::State;

use crate::state::AppState;

/// Response structure for app version information
#[derive(Debug, Serialize, Deserialize)]
pub struct AppVersion {
    /// The current version of the application (e.g., "0.1.0")
    pub version: String,
    /// The product name (e.g., "Draft")
    pub product_name: String,
    /// The app identifier (e.g., "app.usedraft.draft")
    pub identifier: String,
}

/// Get the current application version
/// 
/// This command returns the version information from the Tauri configuration.
/// The version is synchronized across package.json, Cargo.toml, and tauri.conf.json
/// using the sync-version.js script.
/// 
/// # Returns
/// 
/// An `AppVersion` struct containing:
/// - `version`: The current version string
/// - `product_name`: The application name
/// - `identifier`: The app bundle identifier
/// 
/// # Example
/// 
/// ```typescript
/// const version = await getAppVersion();
/// console.log(`Running ${version.product_name} v${version.version}`);
/// ```
#[tauri::command]
pub async fn get_app_version(
    _state: State<'_, AppState>,
) -> Result<AppVersion, String> {
    // Get version from the Tauri config at compile time
    // This is set via the tauri.conf.json file
    let version = env!("CARGO_PKG_VERSION");
    let product_name = "Draft";
    let identifier = "app.usedraft.draft";

    Ok(AppVersion {
        version: version.to_string(),
        product_name: product_name.to_string(),
        identifier: identifier.to_string(),
    })
}
