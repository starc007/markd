import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

interface SettingsState {
  theme: Theme;
  syncEnabled: boolean;
  isLoggedIn: boolean;
  setTheme: (theme: Theme) => void;
  setSyncEnabled: (enabled: boolean) => void;
  setIsLoggedIn: (loggedIn: boolean) => void;
}

const STORAGE_KEY = "usedraft-settings";

// Load initial state from localStorage
const loadSettings = (): Partial<SettingsState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
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
  setTheme: (theme) => {
    set({ theme });
    saveSettings({ ...useSettingsStore.getState(), theme });
  },
  setSyncEnabled: (enabled) => {
    set({ syncEnabled: enabled });
    saveSettings({ ...useSettingsStore.getState(), syncEnabled: enabled });
  },
  setIsLoggedIn: (loggedIn) => {
    set({ isLoggedIn: loggedIn });
    saveSettings({ ...useSettingsStore.getState(), isLoggedIn: loggedIn });
  },
}));
