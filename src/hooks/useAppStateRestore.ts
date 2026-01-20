/**
 * useAppStateRestore Hook
 *
 * Restores app state (currently open note, view, etc.) on app startup.
 * This hook should be called once when the app initializes.
 */

import { useEffect, useRef } from "react";
import { useNoteStore } from "../stores/noteStore";
import { useTabStore } from "../stores/tabStore";
import { useUIStore, UIView } from "../stores/uiStore";
import { loadAppState } from "../lib/app-state-persistence";

export function useAppStateRestore() {
  const { loadNote, expandParentPages } = useNoteStore();
  const { openTab, switchTab } = useTabStore();
  const { setView } = useUIStore();
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

      // Restore tabs if saved
      if (savedState.openTabIds && savedState.openTabIds.length > 0) {
        try {
          // First expand parent pages if saved
          if (savedState.parentPath && savedState.parentPath.length > 0) {
            await expandParentPages(savedState.parentPath);
          }

          // Open all saved tabs
          for (const tabId of savedState.openTabIds) {
            try {
              await openTab(tabId);
            } catch (error) {
              // If a note doesn't exist anymore, skip it
              console.warn(
                `[AppStateRestore] Failed to restore tab ${tabId}:`,
                error
              );
            }
          }

          // Switch to active tab if saved
          if (savedState.activeTabId) {
            switchTab(savedState.activeTabId);
          }
        } catch (error) {
          console.error("[AppStateRestore] Failed to restore tabs:", error);
        }
      } 
    };

    restoreState();
  }, [loadNote, expandParentPages, setView, openTab, switchTab]);
}
