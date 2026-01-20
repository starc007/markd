import { create } from "zustand";

import { useTabStore } from "./tabStore";
import { saveAppState, loadAppState } from "../lib/app-state-persistence";

export enum UIView {
  Notes = "notes",
  StickyNotes = "sticky_notes",
  Bookmarks = "bookmarks",
  Settings = "settings",
  Trash = "trash",
  None = "idle",
}

interface UIStore {
  // State
  sidebarCollapsed: boolean;
  focusMode: boolean;
  commandPaletteOpen: boolean;
  searchOpen: boolean;
  currentView: UIView | null;
  settingsModalOpen: boolean;
  selectedStickyNoteId: string | null;

  // Actions
  toggleSidebar: () => void;
  toggleFocusMode: () => void;
  toggleCommandPalette: () => void;
  toggleSearch: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setView: (view: UIView | null) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setSelectedStickyNoteId: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Initial state
  sidebarCollapsed: false,
  focusMode: false,
  commandPaletteOpen: false,
  searchOpen: false,
  currentView: UIView.None,

  settingsModalOpen: false,
  selectedStickyNoteId: null,
  // Actions
  toggleSidebar: () => {
    set({ sidebarCollapsed: !get().sidebarCollapsed });
  },

  toggleFocusMode: () => {
    set({ focusMode: !get().focusMode });
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
    const { updateActiveTabId } = useTabStore.getState();
    //set active tab to null
    updateActiveTabId(null);

    set({ currentView: view });
    // Persist view change (preserve existing parentPath and tabs)
    const savedState = loadAppState();
    const { openTabs } = useTabStore.getState();
    saveAppState({

      currentView: view ? String(view) : null,
      parentPath: savedState.parentPath || [],
      openTabIds: openTabs.map((tab) => tab.id),
      activeTabId: null,
    });
  },



  setSettingsModalOpen: (open: boolean) => {
    set({ settingsModalOpen: open });
  },

  setSelectedStickyNoteId: (id: string | null) => {
    set({ selectedStickyNoteId: id });
  },
}));
