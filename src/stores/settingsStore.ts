import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

export interface KeyboardShortcut {
  action: string;
  key: string;
  shift?: boolean;
  alt?: boolean;
  ctrl?: boolean;
  meta?: boolean;
}

export interface KeyboardShortcuts {
  commandPalette: KeyboardShortcut;
  newNote: KeyboardShortcut;
  newStickyNote: KeyboardShortcut;
  openStickyNotes: KeyboardShortcut;
  openBookmarks: KeyboardShortcut;
  openSettings: KeyboardShortcut;
  toggleSidebar: KeyboardShortcut;
}

interface SettingsState {
  theme: Theme;
  syncEnabled: boolean;
  isLoggedIn: boolean;
  keyboardShortcuts: KeyboardShortcuts;
  setTheme: (theme: Theme) => void;
  setSyncEnabled: (enabled: boolean) => void;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setKeyboardShortcut: (
    action: keyof KeyboardShortcuts,
    shortcut: KeyboardShortcut
  ) => void;
  resetKeyboardShortcuts: () => void;
}

const STORAGE_KEY = "usedraft-settings";

const defaultKeyboardShortcuts: KeyboardShortcuts = {
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

// Load initial state from localStorage
const loadSettings = (): Partial<SettingsState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge keyboard shortcuts with defaults
      if (parsed.keyboardShortcuts) {
        parsed.keyboardShortcuts = {
          ...defaultKeyboardShortcuts,
          ...parsed.keyboardShortcuts,
        };
      }
      return parsed;
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
  return {};
};

// Save settings to localStorage
const saveSettings = (state: SettingsState) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theme: state.theme,
        syncEnabled: state.syncEnabled,
        isLoggedIn: state.isLoggedIn,
        keyboardShortcuts: state.keyboardShortcuts,
      })
    );
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
};

const initialSettings = loadSettings();

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: (initialSettings.theme as Theme) || "system",
  syncEnabled: initialSettings.syncEnabled ?? false,
  isLoggedIn: initialSettings.isLoggedIn ?? false,
  keyboardShortcuts:
    (initialSettings.keyboardShortcuts as KeyboardShortcuts) ||
    defaultKeyboardShortcuts,
  setTheme: (theme) => {
    const state = useSettingsStore.getState();
    set({ theme });
    saveSettings({ ...state, theme });
  },
  setSyncEnabled: (enabled) => {
    const state = useSettingsStore.getState();
    set({ syncEnabled: enabled });
    saveSettings({ ...state, syncEnabled: enabled });
  },
  setIsLoggedIn: (loggedIn) => {
    const state = useSettingsStore.getState();
    set({ isLoggedIn: loggedIn });
    saveSettings({ ...state, isLoggedIn: loggedIn });
  },
  setKeyboardShortcut: (action, shortcut) => {
    const state = useSettingsStore.getState();
    const newShortcuts = {
      ...state.keyboardShortcuts,
      [action]: shortcut,
    };
    set({ keyboardShortcuts: newShortcuts });
    saveSettings({ ...state, keyboardShortcuts: newShortcuts });
  },
  resetKeyboardShortcuts: () => {
    const state = useSettingsStore.getState();
    set({ keyboardShortcuts: defaultKeyboardShortcuts });
    saveSettings({ ...state, keyboardShortcuts: defaultKeyboardShortcuts });
  },
}));
