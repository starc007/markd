import { create } from "zustand";
import { useNoteStore } from "./noteStore";
import { saveAppState, loadAppState } from "../lib/app-state-persistence";

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
    // Only clear currentNote when switching to Settings or StickyNotes view
    // Don't clear when switching to None (editor view) to prevent flicker
    if (view === UIView.Settings || view === UIView.StickyNotes) {
      useNoteStore.setState({ currentNote: null });
    }
    // Persist view change (preserve existing parentPath)
    const { currentNote } = useNoteStore.getState();
    const savedState = loadAppState();
    saveAppState({
      currentNoteId: currentNote?.id || null,
      currentView: view ? String(view) : null,
      selectedFolderId: get().selectedFolderId,
      parentPath: savedState.parentPath || [],
    });
  },

  setSelectedFolderId: (id: string | null) => {
    set({ selectedFolderId: id });
    // Persist folder selection (preserve existing parentPath)
    const { currentNote } = useNoteStore.getState();
    const savedState = loadAppState();
    saveAppState({
      currentNoteId: currentNote?.id || null,
      currentView: get().currentView ? String(get().currentView) : null,
      selectedFolderId: id,
      parentPath: savedState.parentPath || [],
    });
  },
}));
