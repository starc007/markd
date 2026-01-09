import { useEffect } from "react";
import { useNoteStore } from "../stores/noteStore";
import { useUIStore } from "../stores/uiStore";

/**
 * Hook to refresh data when window regains focus
 * This ensures the app shows the latest data when users switch back to it
 */
export function useWindowFocus() {
  useEffect(() => {
    const handleFocus = () => {
      const { loadNotes, currentNote, loadNote } = useNoteStore.getState();
      const { selectedFolderId } = useUIStore.getState();

      // Reload the notes list to get any changes made externally
      loadNotes(selectedFolderId || undefined, null);

      // If there's a current note open, reload it to get the latest content
      if (currentNote) {
        loadNote(currentNote.id);
      }
    };

    // Listen for window focus events
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);
}
