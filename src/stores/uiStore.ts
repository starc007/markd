import { create } from "zustand";

export enum UIView {
  Notes = "notes",
  StickyNotes = "sticky_notes",
  Settings = "settings",
  None = "idle",
}

interface UIStore {
  // State
  sidebarCollapsed: boolean;
  focusMode: boolean;
  commandPaletteOpen: boolean;
  searchOpen: boolean;
  selectedFolderId: string | null;
  currentView: UIView | null;

  // Actions
  toggleSidebar: () => void;
  toggleFocusMode: () => void;
  toggleCommandPalette: () => void;
  toggleSearch: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setView: (view: UIView | null) => void;
  setSelectedFolderId: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Initial state
  sidebarCollapsed: false,
  focusMode: false,
  commandPaletteOpen: false,
  searchOpen: false,
  selectedFolderId: null,
  currentView: UIView.None,

  // Actions
  toggleSidebar: () => {
    set({ sidebarCollapsed: !get().sidebarCollapsed });
  },

  toggleFocusMode: () => {
    const { focusMode, sidebarCollapsed } = get();
    set({
      focusMode: !focusMode,
      // In focus mode, also hide sidebar
      sidebarCollapsed: !focusMode ? true : sidebarCollapsed,
    });
  },

  toggleCommandPalette: () => {
    set({ commandPaletteOpen: !get().commandPaletteOpen });
  },

  toggleSearch: () => {
    set({ searchOpen: !get().searchOpen });
  },

  setCommandPaletteOpen: (open) => {
    set({ commandPaletteOpen: open });
  },

  setSearchOpen: (open) => {
    set({ searchOpen: open });
  },

  setView: (view: UIView | null) => {
    set({ currentView: view });
  },

  setSelectedFolderId: (id: string | null) => {
    set({ selectedFolderId: id });
  },
}));
