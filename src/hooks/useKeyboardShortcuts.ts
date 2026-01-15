import { useEffect } from "react";
import { useNoteStore } from "../stores/noteStore";
import { useUIStore, UIView } from "../stores/uiStore";
import { useStickyNotesStore } from "../features/sticky-notes/stores/stickyNotesStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useTabStore } from "../stores/tabStore";
import { fixedShortcuts, getSwitchTabShortcut } from "../lib/keyboard-shortcuts";

// Helper function to check if a keyboard event matches a shortcut
export function matchesShortcut(
  e: KeyboardEvent,
  shortcut: {
    key: string;
    meta?: boolean;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
  }
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
    if (shortcutKey === "," && key !== ",") return false;
    if (shortcutKey === "enter" && key !== "enter") return false;
    if (
      shortcutKey !== "space" &&
      shortcutKey !== "\\" &&
      shortcutKey !== "," &&
      shortcutKey !== "enter" &&
      key !== shortcutKey
    )
      return false;
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
  const { createNote, loadNote } = useNoteStore();
  const {
    toggleSidebar,
    toggleCommandPalette,
    setCommandPaletteOpen,
    setView,
  } = useUIStore();
  const { createStickyNote } = useStickyNotesStore();
  const { keyboardShortcuts } = useSettingsStore();
  const setSettingsModalOpen = useUIStore(
    (state) => state.setSettingsModalOpen
  );
  const { closeTab, reopenClosedTab, switchTab, openTabs, activeTabId } =
    useTabStore();

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

      // Check customizable shortcuts
      if (matchesShortcut(e, keyboardShortcuts.commandPalette)) {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      if (matchesShortcut(e, keyboardShortcuts.newNote)) {
        e.preventDefault();
        console.log("creating new note");
        const note = await createNote("Untitled");
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
        const { activeTabId: currentActiveTabId } = useTabStore.getState();
        if (currentActiveTabId) {
          e.preventDefault();
          closeTab(currentActiveTabId);
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
            const { openTabs: currentOpenTabs } = useTabStore.getState();
            if (currentOpenTabs.length >= tabNumber) {
              e.preventDefault();
              switchTab(currentOpenTabs[tabNumber - 1].id);
            }
          }
          return;
        }
      }

      // Escape: Close command palette or settings modal (not customizable)
      if (matchesShortcut(e, fixedShortcuts.escape)) {
        const { settingsModalOpen } = useUIStore.getState();
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
  }, [
    toggleSidebar,
    toggleCommandPalette,
    setCommandPaletteOpen,
    createNote,
    loadNote,
    createStickyNote,
    setView,
    keyboardShortcuts,
    setSettingsModalOpen,
    closeTab,
    reopenClosedTab,
    switchTab,
    openTabs,
    activeTabId,
  ]);
}
