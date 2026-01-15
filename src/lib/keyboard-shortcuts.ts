/**
 * Keyboard Shortcuts Configuration
 *
 * Centralized configuration for all keyboard shortcuts in the application.
 * This includes both customizable shortcuts (from settings) and non-customizable shortcuts.
 */

export interface KeyboardShortcut {
  action: string;
  key: string;
  shift?: boolean;
  alt?: boolean;
  ctrl?: boolean;
  meta?: boolean;
}

/**
 * Customizable shortcuts (can be changed in settings)
 */
export interface CustomizableShortcuts {
  commandPalette: KeyboardShortcut;
  newNote: KeyboardShortcut;
  newStickyNote: KeyboardShortcut;
  openStickyNotes: KeyboardShortcut;
  openBookmarks: KeyboardShortcut;
  openSettings: KeyboardShortcut;
  toggleSidebar: KeyboardShortcut;
}

/**
 * Non-customizable shortcuts (fixed shortcuts)
 */
export interface FixedShortcuts {
  closeTab: KeyboardShortcut;
  reopenTab: KeyboardShortcut;
  switchTab1: KeyboardShortcut;
  switchTab2: KeyboardShortcut;
  switchTab3: KeyboardShortcut;
  switchTab4: KeyboardShortcut;
  switchTab5: KeyboardShortcut;
  switchTab6: KeyboardShortcut;
  switchTab7: KeyboardShortcut;
  switchTab8: KeyboardShortcut;
  switchTab9: KeyboardShortcut;
  escape: KeyboardShortcut;
  deleteNote: KeyboardShortcut;
  confirmDelete: KeyboardShortcut;
  focusSearch: KeyboardShortcut;
}

/**
 * Default customizable shortcuts
 */
export const defaultCustomizableShortcuts: CustomizableShortcuts = {
  commandPalette: { action: "commandPalette", key: "k", meta: true },
  newNote: { action: "newNote", key: "n", meta: true },
  newStickyNote: { action: "newStickyNote", key: "n", meta: true, shift: true },
  openStickyNotes: {
    action: "openStickyNotes",
    key: "o",
    meta: true,
    shift: true,
  },
  openBookmarks: { action: "openBookmarks", key: "b", meta: true, shift: true },
  openSettings: { action: "openSettings", key: ",", meta: true },
  toggleSidebar: { action: "toggleSidebar", key: "\\", meta: true },
};

/**
 * Fixed shortcuts (non-customizable)
 */
export const fixedShortcuts: FixedShortcuts = {
  closeTab: { action: "closeTab", key: "w", meta: true },
  reopenTab: { action: "reopenTab", key: "t", meta: true, shift: true },
  switchTab1: { action: "switchTab1", key: "1", meta: true },
  switchTab2: { action: "switchTab2", key: "2", meta: true },
  switchTab3: { action: "switchTab3", key: "3", meta: true },
  switchTab4: { action: "switchTab4", key: "4", meta: true },
  switchTab5: { action: "switchTab5", key: "5", meta: true },
  switchTab6: { action: "switchTab6", key: "6", meta: true },
  switchTab7: { action: "switchTab7", key: "7", meta: true },
  switchTab8: { action: "switchTab8", key: "8", meta: true },
  switchTab9: { action: "switchTab9", key: "9", meta: true },
  escape: { action: "escape", key: "Escape" },
  deleteNote: { action: "deleteNote", key: "d", meta: true, shift: true },
  confirmDelete: { action: "confirmDelete", key: "Enter", meta: true },
  focusSearch: { action: "focusSearch", key: "f", meta: true },
};

/**
 * Helper to get switch tab shortcut by number (1-9)
 */
export function getSwitchTabShortcut(tabNumber: number): KeyboardShortcut {
  if (tabNumber < 1 || tabNumber > 9) {
    throw new Error("Tab number must be between 1 and 9");
  }
  return fixedShortcuts[`switchTab${tabNumber}` as keyof FixedShortcuts] as KeyboardShortcut;
}

/**
 * All shortcuts combined (for reference/documentation)
 */
export const allShortcuts = {
  ...defaultCustomizableShortcuts,
  ...fixedShortcuts,
};

/**
 * Format a shortcut for display (e.g., ["⌘", "K"] for Cmd+K)
 */
export function formatShortcutDisplay(shortcut: KeyboardShortcut): string[] {
  const parts: string[] = [];
  if (shortcut.meta) parts.push("⌘");
  if (shortcut.ctrl) parts.push("⌃");
  if (shortcut.alt) parts.push("⌥");
  if (shortcut.shift) parts.push("⇧");
  
  // Format key display
  const keyDisplay =
    shortcut.key === "space"
      ? "Space"
      : shortcut.key === "\\"
      ? "\\"
      : shortcut.key === ","
      ? ","
      : shortcut.key === "Escape"
      ? "Esc"
      : shortcut.key === "Enter"
      ? "Enter"
      : shortcut.key.toUpperCase();
  parts.push(keyDisplay);
  
  return parts;
}
