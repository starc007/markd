import { useEffect } from "react";
import { useNoteStore } from "../stores/noteStore";
import { useTabStore } from "../stores/tabStore";

/**
 * Hook to refresh data when window regains focus
 * This ensures the app shows the latest data when users switch back to it
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

    // Listen for window focus events
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);
}
