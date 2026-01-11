/**
 * useAppStateRestore Hook
 *
 * Restores app state (currently open note, view, etc.) on app startup.
 * This hook should be called once when the app initializes.
 */

import { useEffect, useRef } from "react";
import { useNoteStore } from "../stores/noteStore";
import { useUIStore, UIView } from "../stores/uiStore";
import { loadAppState } from "../lib/app-state-persistence";

export function useAppStateRestore() {
  const { loadNote, expandParentPages } = useNoteStore();
  const { setView, setSelectedFolderId } = useUIStore();
  const hasRestored = useRef(false);

  useEffect(() => {
    // Only restore once on mount
    if (hasRestored.current) return;
    hasRestored.current = true;

    const restoreState = async () => {
      const savedState = loadAppState();

      // Restore view if saved
      if (savedState.currentView) {
        try {
          // Map string to UIView enum
          const viewMap: Record<string, UIView | null> = {
            notes: UIView.Notes,
            sticky_notes: UIView.StickyNotes,
            settings: UIView.Settings,
            idle: UIView.None,
            bookmarks: UIView.Bookmarks,
          };
          const view = viewMap[savedState.currentView];
          if (view !== undefined) {
            setView(view);
          }
        } catch (error) {
          console.error("[AppStateRestore] Failed to restore view:", error);
        }
      }

      // Restore selected folder if saved
      if (savedState.selectedFolderId) {
        setSelectedFolderId(savedState.selectedFolderId);
      }

      // Restore current note if saved
      if (savedState.currentNoteId) {
        try {
          // First expand parent pages if saved
          if (savedState.parentPath && savedState.parentPath.length > 0) {
            await expandParentPages(savedState.parentPath);
          }
          // Then load the note
          await loadNote(savedState.currentNoteId);
        } catch (error) {
          console.error(
            "[AppStateRestore] Failed to restore note:",
            savedState.currentNoteId,
            error
          );
          // If note doesn't exist anymore, clear the saved state
          // This can happen if the note was deleted
        }
      }
    };

    restoreState();
  }, [loadNote, expandParentPages, setView, setSelectedFolderId]);
}
