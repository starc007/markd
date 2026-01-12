import { useEffect, useCallback } from "react";
import { useUpdateStore } from "../stores/updateStore";
import {
  checkForUpdates,
  downloadAndInstall,
  restartApp,
  type UpdateEvent,
} from "../lib/tauri/update";
import { getAppVersion } from "../lib/tauri/commands";

/**
 * Hook for checking and managing app updates
 *
 * Features:
 * - Automatic update check on mount
 * - Periodic update checks (every 24 hours)
 * - Manual update check function
 * - Download and install functionality
 *
 * @param options Configuration options
 * @param options.autoCheck Whether to automatically check on mount (default: true)
 * @param options.checkInterval Interval in milliseconds for periodic checks (default: 24 hours)
 */
export function useUpdateCheck(options?: {
  autoCheck?: boolean;
  checkInterval?: number;
}) {
  const {
    status,
    update,
    currentVersion,
    error,
    downloadProgress,
    lastChecked,
    setStatus,
    setUpdate,
    setCurrentVersion,
    setError,
    setDownloadProgress,
    setLastChecked,
  } = useUpdateStore();

  const { autoCheck = true, checkInterval = 24 * 60 * 60 * 1000 } =
    options || {};

  /**
   * Check for available updates
   */
  const check = useCallback(async () => {
    try {
      setStatus("checking");
      setError(null);

      // Get current version first
      const appInfo = await getAppVersion();
      setCurrentVersion(appInfo.version);

      // Check for updates
      const result = await checkForUpdates(appInfo.version);

      if (result.available && result.update) {
        setUpdate(result.update);
        setStatus("available");
      } else {
        setUpdate(null);
        setStatus("idle");
      }

      setLastChecked(Date.now());
    } catch (err) {
      console.error("Failed to check for updates:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
      setUpdate(null);
    }
  }, [setStatus, setError, setUpdate, setCurrentVersion, setLastChecked]);

  /**
   * Download and install the available update
   */
  const download = useCallback(async () => {
    if (!update) {
      setError("No update available to download");
      return;
    }

    try {
      setStatus("downloading");
      setError(null);
      setDownloadProgress(0);

      await downloadAndInstall(update, (event: UpdateEvent) => {
        switch (event.event) {
          case "Started":
            setDownloadProgress(0);
            break;
          case "Progress":
            // Calculate progress if we have content length
            if (event.data.contentLength && event.data.chunkLength) {
              // This is approximate - the actual progress is tracked internally
              // by the updater plugin
              const progress = Math.min(
                (event.data.chunkLength / event.data.contentLength) * 100,
                100
              );
              setDownloadProgress(progress);
            }
            break;
          case "Finished":
            setDownloadProgress(100);
            setStatus("ready");
            break;
        }
      });
    } catch (err) {
      console.error("Failed to download update:", err);
      setError(err instanceof Error ? err.message : "Download failed");
      setStatus("error");
    }
  }, [update, setStatus, setError, setDownloadProgress]);

  /**
   * Install the downloaded update and restart the app
   */
  const install = useCallback(async () => {
    try {
      setError(null);
      await restartApp();
      // App will restart, so this code won't execute
    } catch (err) {
      console.error("Failed to restart app:", err);
      setError(err instanceof Error ? err.message : "Restart failed");
      setStatus("error");
    }
  }, [setError, setStatus]);

  // Auto-check on mount
  useEffect(() => {
    if (autoCheck) {
      // Check immediately
      check();

      // Set up periodic checks
      const interval = setInterval(() => {
        check();
      }, checkInterval);

      return () => clearInterval(interval);
    }
  }, [autoCheck, checkInterval, check]);

  return {
    // State
    status,
    update,
    currentVersion,
    error,
    downloadProgress,
    lastChecked,

    // Actions
    check,
    download,
    install,

    // Computed
    isUpdateAvailable: status === "available",
    isDownloading: status === "downloading",
    isReady: status === "ready",
    hasError: status === "error",
  };
}
