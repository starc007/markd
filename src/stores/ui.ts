import { create } from "zustand";

type SaveState = "idle" | "saving" | "error";
export type SettingsPage = "general" | "cloud" | "appearance" | "shortcuts";

interface UiState {
  paletteOpen: boolean;
  settingsOpen: boolean;
  settingsPage: SettingsPage;
  sidebarHidden: boolean;
  backlinksHidden: boolean;
  markdownSource: boolean;
  saveState: SaveState;
  setPaletteOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  openSettings: (page?: SettingsPage) => void;
  setSettingsPage: (page: SettingsPage) => void;
  toggleSidebar: () => void;
  toggleBacklinks: () => void;
  toggleMarkdownSource: () => void;
  setSaveState: (state: SaveState) => void;
}

export const useUi = create<UiState>((set, get) => ({
  paletteOpen: false,
  settingsOpen: false,
  settingsPage: "general",
  sidebarHidden: false,
  backlinksHidden: true,
  markdownSource: false,
  saveState: "idle",
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  openSettings: (settingsPage = "general") =>
    set({ settingsOpen: true, settingsPage }),
  setSettingsPage: (settingsPage) => set({ settingsPage }),
  toggleSidebar: () => set({ sidebarHidden: !get().sidebarHidden }),
  toggleBacklinks: () => set({ backlinksHidden: !get().backlinksHidden }),
  toggleMarkdownSource: () =>
    set({ markdownSource: !get().markdownSource }),
  setSaveState: (saveState) => set({ saveState }),
}));
