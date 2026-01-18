import { useEffect } from "react";
import { useNoteStore } from "../stores/noteStore";
import { useTabStore } from "../stores/tabStore";
import { flushPendingSaves } from "../lib/tauri/commands";

/**
 * Hook to refresh data when window regains focus and flush saves on blur
 * This ensures the app shows the latest data when users switch back to it
 * and that no data is lost when the window loses focus
 *
 * IMPORTANT: This hook checks for saving state to avoid overwriting unsaved changes
 */
export function useWindowFocus() {
  useEffect(() => {
    const handleFocus = () => {
      const { loadNotes, loadNote, isSaving } = useNoteStore.getState();
      const { getActiveTab } = useTabStore.getState();

      // Don't reload if we're currently saving - this prevents data loss
      // The save queue will handle persistence, and next focus will refresh
      if (isSaving) {
        console.log("[useWindowFocus] Skipping reload - save in progress");
        return;
      }

      // Reload the notes list to get any changes made externally
      loadNotes(undefined, null);

      // If there's an active tab open, reload it to get the latest content
      const activeTab = getActiveTab();
      if (activeTab) {
        loadNote(activeTab.id);
      }
    };

    const handleBlur = () => {
      // Flush pending saves when window loses focus to minimize data loss
      flushPendingSaves().catch((error) => {
        console.error("[useWindowFocus] Failed to flush pending saves:", error);
      });
    };

    // Listen for window focus/blur events
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);
}
