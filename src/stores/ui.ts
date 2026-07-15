import { create } from "zustand";

type SaveState = "idle" | "saving" | "error";

interface UiState {
  paletteOpen: boolean;
  settingsOpen: boolean;
  quickCaptureOpen: boolean;
  sidebarHidden: boolean;
  backlinksHidden: boolean;
  markdownSource: boolean;
  saveState: SaveState;
  setPaletteOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setQuickCaptureOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleBacklinks: () => void;
  toggleMarkdownSource: () => void;
  setSaveState: (state: SaveState) => void;
}

export const useUi = create<UiState>((set, get) => ({
  paletteOpen: false,
  settingsOpen: false,
  quickCaptureOpen: false,
  sidebarHidden: false,
  backlinksHidden: true,
  markdownSource: false,
  saveState: "idle",
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setQuickCaptureOpen: (quickCaptureOpen) => set({ quickCaptureOpen }),
  toggleSidebar: () => set({ sidebarHidden: !get().sidebarHidden }),
  toggleBacklinks: () => set({ backlinksHidden: !get().backlinksHidden }),
  toggleMarkdownSource: () =>
    set({ markdownSource: !get().markdownSource }),
  setSaveState: (saveState) => set({ saveState }),
}));
