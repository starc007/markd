import { useEffect } from "react";
import { useNoteStore } from "../stores/noteStore";
import { useTabStore } from "../stores/tabStore";

/**
 * Hook to refresh data when window regains focus
 * This ensures the app shows the latest data when users switch back to it
 */
export function useWindowFocus() {
  useEffect(() => {
    const handleFocus = () => {
      const { loadNotes, loadNote } = useNoteStore.getState();
      const { getActiveTab } = useTabStore.getState();

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
