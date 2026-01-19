import { useEffect, useRef } from "react";
import { useNoteStore } from "../stores/noteStore";
import { useUIStore, UIView } from "../stores/uiStore";
import { useStickyNotesStore } from "../features/sticky-notes/stores/stickyNotesStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useTabStore } from "../stores/tabStore";
import {
  fixedShortcuts,
  getSwitchTabShortcut,
} from "../lib/keyboard-shortcuts";

// Helper function to check if a keyboard event matches a shortcut
export function matchesShortcut(
  e: KeyboardEvent,
  shortcut: {
    key: string;
    meta?: boolean;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
  },
): boolean {
  // Handle Escape key specially (case-sensitive)
  if (shortcut.key === "Escape") {
    if (e.key !== "Escape") return false;
  } else {
    const key = e.key.toLowerCase();
    const shortcutKey = shortcut.key.toLowerCase();

    // Handle special keys
    if (shortcutKey === "space" && key !== " ") return false;
    if (shortcutKey === "\\" && key !== "\\") return false;
    // Handle comma - can be "," or "Comma" (browser may report as "Comma")
    if (shortcutKey === ",") {
      // Accept both "," and "comma" (from "Comma")
      if (key !== "," && key !== "comma") return false;
    } else if (key === "," || key === "comma") {
      // If the event key is comma but shortcut key is not, it doesn't match
      return false;
    } else if (shortcutKey === "enter" && key !== "enter") {
      return false;
    } else if (
      shortcutKey !== "space" &&
      shortcutKey !== "\\" &&
      shortcutKey !== "," &&
      shortcutKey !== "enter" &&
      key !== shortcutKey
    ) {
      return false;
    }
  }

  // Check modifiers - meta/ctrl are interchangeable (meta on Mac, ctrl on Windows/Linux)
  // If shortcut requires meta, accept either metaKey or ctrlKey
  // If shortcut doesn't require meta, reject if either is pressed (unless ctrl is specifically required)
  const hasMetaOrCtrl = e.metaKey || e.ctrlKey;
  if (shortcut.meta) {
    if (!hasMetaOrCtrl) return false;
  } else {
    // If meta is not required, we need to check if ctrl is required
    if (shortcut.ctrl) {
      // Ctrl is required, so meta/ctrl is allowed
      if (!hasMetaOrCtrl) return false;
    } else {
      // Neither meta nor ctrl should be pressed
      if (hasMetaOrCtrl) return false;
    }
  }

  // Check ctrl specifically (for cases where ctrl is required but not meta)
  if (shortcut.ctrl && !e.ctrlKey && !e.metaKey) return false;

  if (shortcut.alt && !e.altKey) return false;
  if (!shortcut.alt && e.altKey) return false;

  if (shortcut.shift && !e.shiftKey) return false;
  if (!shortcut.shift && e.shiftKey) return false;

  return true;
}

export function useKeyboardShortcuts() {
  // Store refs to avoid stale closures while keeping event listener stable
  const keyboardShortcutsRef = useRef(
    useSettingsStore.getState().keyboardShortcuts,
  );

  // Subscribe to keyboard shortcuts changes
  useEffect(() => {
    const unsubscribe = useSettingsStore.subscribe((state) => {
      keyboardShortcutsRef.current = state.keyboardShortcuts;
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      // Don't handle shortcuts when typing in inputs/textarea (except for Escape and modifier combinations)
      const target = e.target as HTMLElement;
      if (
        e.key !== "Escape" &&
        !isMod &&
        (target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable)
      ) {
        return;
      }

      // Get fresh state from stores inside the handler to avoid stale closures
      const keyboardShortcuts = keyboardShortcutsRef.current;
      const {
        toggleSidebar,
        toggleCommandPalette,
        setCommandPaletteOpen,
        setView,
        setSettingsModalOpen,
        settingsModalOpen,
      } = useUIStore.getState();
      const { createNote, loadNote,createSubpage } = useNoteStore.getState();
      const { createStickyNote } = useStickyNotesStore.getState();
      const { closeTab, reopenClosedTab, switchTab, openTabs, activeTabId } =
        useTabStore.getState();

      // Check customizable shortcuts
      if (matchesShortcut(e, keyboardShortcuts.commandPalette)) {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      if (matchesShortcut(e, keyboardShortcuts.newNote)) {
        e.preventDefault();
        const note = activeTabId ? await createSubpage(activeTabId, "Untitled") : await createNote("Untitled");
        if (note) {
          setView(UIView.None);
          loadNote(note.id);
        }
        return;
      }

      if (matchesShortcut(e, keyboardShortcuts.newStickyNote)) {
        e.preventDefault();
        await createStickyNote();
        setView(UIView.StickyNotes);
        return;
      }

      if (matchesShortcut(e, keyboardShortcuts.openStickyNotes)) {
        e.preventDefault();
        setView(UIView.StickyNotes);
        return;
      }

      if (matchesShortcut(e, keyboardShortcuts.openBookmarks)) {
        e.preventDefault();
        setView(UIView.Bookmarks);
        return;
      }

      if (matchesShortcut(e, keyboardShortcuts.openSettings)) {
        e.preventDefault();
        setSettingsModalOpen(true);
        return;
      }

      if (matchesShortcut(e, keyboardShortcuts.toggleSidebar)) {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Tab shortcuts (not customizable)
      // Cmd+W: Close current tab
      if (matchesShortcut(e, fixedShortcuts.closeTab)) {
        if (activeTabId) {
          e.preventDefault();
          closeTab(activeTabId);
        }
        return;
      }

      // Cmd+Shift+T: Reopen closed tab
      if (matchesShortcut(e, fixedShortcuts.reopenTab)) {
        e.preventDefault();
        reopenClosedTab();
        return;
      }

      // Cmd+1-9: Switch to tab by number
      if (isMod && !e.shiftKey && !e.altKey) {
        const key = e.key;
        const tabNumber = parseInt(key, 10);
        if (!isNaN(tabNumber) && tabNumber >= 1 && tabNumber <= 9) {
          const shortcut = getSwitchTabShortcut(tabNumber);
          if (matchesShortcut(e, shortcut)) {
            if (openTabs.length >= tabNumber) {
              e.preventDefault();
              switchTab(openTabs[tabNumber - 1].id);
            }
          }
          return;
        }
      }

      // Escape: Close command palette or settings modal (not customizable)
      if (matchesShortcut(e, fixedShortcuts.escape)) {
        if (settingsModalOpen) {
          setSettingsModalOpen(false);
        } else {
          setCommandPaletteOpen(false);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []); // Empty dependency array - handler gets fresh state from stores
}
