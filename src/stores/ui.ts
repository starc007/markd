import { create } from "zustand";

type SaveState = "idle" | "saving" | "error";

interface UiState {
  paletteOpen: boolean;
  settingsOpen: boolean;
  sidebarHidden: boolean;
  backlinksHidden: boolean;
  markdownSource: boolean;
  saveState: SaveState;
  setPaletteOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleBacklinks: () => void;
  toggleMarkdownSource: () => void;
  setSaveState: (state: SaveState) => void;
}

export const useUi = create<UiState>((set, get) => ({
  paletteOpen: false,
  settingsOpen: false,
  sidebarHidden: false,
  backlinksHidden: true,
  markdownSource: false,
  saveState: "idle",
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  toggleSidebar: () => set({ sidebarHidden: !get().sidebarHidden }),
  toggleBacklinks: () => set({ backlinksHidden: !get().backlinksHidden }),
  toggleMarkdownSource: () =>
    set({ markdownSource: !get().markdownSource }),
  setSaveState: (saveState) => set({ saveState }),
}));
