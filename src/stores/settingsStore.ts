import { create } from "zustand";
import type {
  KeyboardShortcut,
  CustomizableShortcuts,
} from "../lib/keyboard-shortcuts";
import { defaultCustomizableShortcuts } from "../lib/keyboard-shortcuts";

export type Theme = "light" | "dark" | "system";

// Re-export for backward compatibility
export type { KeyboardShortcut };

export type KeyboardShortcuts = CustomizableShortcuts;

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

// Load initial state from localStorage
const loadSettings = (): Partial<SettingsState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge keyboard shortcuts with defaults
      if (parsed.keyboardShortcuts) {
        // Migrate old openSettings shortcut (Cmd+Shift+T) to new one (Cmd+,)
        if (
          parsed.keyboardShortcuts.openSettings?.key === "t" &&
          parsed.keyboardShortcuts.openSettings?.shift === true
        ) {
          parsed.keyboardShortcuts.openSettings =
            defaultCustomizableShortcuts.openSettings;
        }
        parsed.keyboardShortcuts = {
          ...defaultCustomizableShortcuts,
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
    defaultCustomizableShortcuts,
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
    set({ keyboardShortcuts: defaultCustomizableShortcuts });
    saveSettings({ ...state, keyboardShortcuts: defaultCustomizableShortcuts });
  },
}));
