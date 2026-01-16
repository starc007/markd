/**
 * Update Management Utilities
 *
 * This module provides utilities for checking and installing updates
 * using the Tauri updater plugin directly from the frontend.
 *
 * The updater is configured in tauri.conf.json with endpoints and public key.
 */

import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

/**
 * Update information returned by the updater plugin
 *
 * Note: This matches the Update type from @tauri-apps/plugin-updater
 * where date and body may be undefined
 */
export interface Update {
  version: string;
  date?: string;
  body?: string | null;
}

/**
 * Update event types for download progress tracking
 */
export type UpdateEventType = "Started" | "Progress" | "Finished";

/**
 * Update event data structure
 */
export interface UpdateEventData {
  contentLength?: number;
  chunkLength?: number;
  downloaded?: number; // Cumulative downloaded bytes
}

/**
 * Update event structure
 */
export interface UpdateEvent {
  event: UpdateEventType;
  data: UpdateEventData;
}

/**
 * Update check result
 */
export interface UpdateCheckResult {
  available: boolean;
  update: Update | null;
  currentVersion: string;
}

/**
 * Check for available updates
 *
 * Checks the configured update endpoints for a newer version.
 * Returns information about whether an update is available.
 *
 * @param currentVersion - The current app version (optional, will be fetched if not provided)
 * @returns Promise resolving to UpdateCheckResult with update availability and details
 *
 * @example
 * ```typescript
 * const result = await checkForUpdates();
 * if (result.available) {
 *   console.log(`Update available: ${result.update?.version}`);
 * }
 * ```
 */
export async function checkForUpdates(
  currentVersion?: string
): Promise<
  UpdateCheckResult & { pluginUpdate?: Awaited<ReturnType<typeof check>> }
> {
  try {
    // Get current version if not provided
    let version = currentVersion;
    if (!version) {
      const { getAppVersion } = await import("./commands");
      const appInfo = await getAppVersion();
      version = appInfo.version;
    }

    // Check for updates using the Tauri updater plugin
    const pluginUpdate = await check();

    if (pluginUpdate) {
      return {
        available: true,
        update: {
          version: pluginUpdate.version,
          date: pluginUpdate.date,
          body: pluginUpdate.body ?? null,
        },
        currentVersion: version,
        pluginUpdate, // Return the actual plugin update object
      };
    }

    return {
      available: false,
      update: null,
      currentVersion: version,
      pluginUpdate: undefined,
    };
  } catch (error) {
    // If update check fails (e.g., server down, network error),
    // return no update available rather than throwing
    // This prevents the app from breaking if the update server is unavailable
    console.error("Failed to check for updates:", error);
    return {
      available: false,
      update: null,
      currentVersion: currentVersion || "unknown",
      pluginUpdate: undefined,
    };
  }
}

/**
 * Download and install an update
 *
 * Downloads the provided update and installs it. The app will need to be
 * restarted after installation completes.
 *
 * @param update - The update object returned from checkForUpdates
 * @param onProgress - Optional callback for download progress updates
 * @returns Promise that resolves when download and installation complete
 *
 * @example
 * ```typescript
 * const result = await checkForUpdates();
 * if (result.available && result.update) {
 *   await downloadAndInstall(result.update, (event) => {
 *     console.log('Progress:', event);
 *   });
 *   await relaunch();
 * }
 * ```
 */
export async function downloadAndInstall(
  update: Update,
  onProgress?: (event: UpdateEvent) => void
): Promise<void> {
  // Import the update object from the plugin
  // We need to get the actual Update object from the plugin, not our interface
  const pluginUpdate = await check();

  if (!pluginUpdate) {
    throw new Error("No update available to download");
  }

  // Verify the update matches what we expect
  if (pluginUpdate.version !== update.version) {
    throw new Error(
      `Update version mismatch: expected ${update.version}, got ${pluginUpdate.version}`
    );
  }

  let downloaded = 0;
  let contentLength = 0;

  // Download and install the update
  // The callback receives progress events
  await pluginUpdate.downloadAndInstall((event) => {
    switch (event.event) {
      case "Started":
        contentLength = event.data.contentLength || 0;
        console.log(`Started downloading ${contentLength} bytes`);
        onProgress?.({
          event: "Started",
          data: { contentLength },
        });
        break;
      case "Progress":
        downloaded += event.data.chunkLength || 0;
        const progress =
          contentLength > 0 ? (downloaded / contentLength) * 100 : 0;
        console.log(
          `Downloaded ${downloaded} / ${contentLength} bytes (${progress.toFixed(
            2
          )}%)`
        );
        onProgress?.({
          event: "Progress",
          data: {
            chunkLength: event.data.chunkLength,
            contentLength,
            downloaded, // Pass cumulative downloaded amount
          },
        });
        break;
      case "Finished":
        console.log("Download finished, installing...");
        onProgress?.({
          event: "Finished",
          data: {},
        });
        break;
    }
  });

  console.log("Update installed successfully");
}

/**
 * Restart the application
 *
 * This should be called after downloadAndInstall completes.
 * The app will close and restart with the new version.
 *
 * @returns Promise that resolves when restart is initiated (app will exit)
 *
 * @example
 * ```typescript
 * await downloadAndInstall(update);
 * await restartApp();
 * ```
 */
export async function restartApp(): Promise<void> {
  await relaunch();
}
