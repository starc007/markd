import { useEffect, useCallback, useRef } from "react";
import { useUpdateStore } from "../stores/updateStore";
import { checkForUpdates, restartApp } from "../lib/tauri/update";
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
    pluginUpdate,
    currentVersion,
    error,
    downloadProgress,
    lastChecked,
    setStatus,
    setUpdate,
    setPluginUpdate,
    setCurrentVersion,
    setError,
    setDownloadProgress,
    setLastChecked,
  } = useUpdateStore();

  const { autoCheck = true, checkInterval = 24 * 60 * 60 * 1000 } =
    options || {};

  // Ref to throttle progress updates
  const progressThrottleRef = useRef({ lastUpdate: 0, lastProgress: 0 });

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
        setPluginUpdate(result.pluginUpdate || null);
        setStatus("available");
      } else {
        setUpdate(null);
        setPluginUpdate(null);
        setStatus("idle");
      }

      setLastChecked(Date.now());
    } catch (err) {
      console.error("Failed to check for updates:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
      setUpdate(null);
      setPluginUpdate(null);
    }
  }, [
    setStatus,
    setError,
    setUpdate,
    setPluginUpdate,
    setCurrentVersion,
    setLastChecked,
  ]);

  /**
   * Download and install the available update
   */
  const download = useCallback(async () => {
    if (!pluginUpdate) {
      setError("No update available to download");
      return;
    }

    try {
      setStatus("downloading");
      setError(null);
      setDownloadProgress(0);

      let downloaded = 0;
      let contentLength = 0;

      // Reset throttle ref
      progressThrottleRef.current = { lastUpdate: 0, lastProgress: 0 };

      await pluginUpdate.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength || 0;
            downloaded = 0;
            progressThrottleRef.current = {
              lastUpdate: Date.now(),
              lastProgress: 0,
            };
            setDownloadProgress(0);
            break;
          case "Progress":
            downloaded += event.data.chunkLength || 0;
            const progress =
              contentLength > 0
                ? Math.min((downloaded / contentLength) * 100, 100)
                : 0;

            // Throttle updates: only update if enough time passed or significant change
            const now = Date.now();
            const timeSinceLastUpdate =
              now - progressThrottleRef.current.lastUpdate;
            const progressDelta = Math.abs(
              progress - progressThrottleRef.current.lastProgress,
            );

            // Update if: 200ms passed, progress changed by 2%, or reached 100%
            // This prevents React maximum update depth error
            if (
              timeSinceLastUpdate >= 200 ||
              progressDelta >= 2 ||
              progress >= 100
            ) {
              progressThrottleRef.current = {
                lastUpdate: now,
                lastProgress: progress,
              };
              setDownloadProgress(progress);
            }
            break;
          case "Finished":
            progressThrottleRef.current = {
              lastUpdate: Date.now(),
              lastProgress: 100,
            };
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
  }, [pluginUpdate, setStatus, setError, setDownloadProgress]);

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
