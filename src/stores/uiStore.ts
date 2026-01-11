import { create } from "zustand";
import { useNoteStore } from "./noteStore";
import { saveAppState, loadAppState } from "../lib/app-state-persistence";

export enum UIView {
  Notes = "notes",
  StickyNotes = "sticky_notes",
  Bookmarks = "bookmarks",
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
  previousNoteId: string | null; // Track note we came from when navigating to bookmarks

  // Actions
  toggleSidebar: () => void;
  toggleFocusMode: () => void;
  toggleCommandPalette: () => void;
  toggleSearch: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setView: (view: UIView | null) => void;
  setSelectedFolderId: (id: string | null) => void;
  setPreviousNoteId: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Initial state
  sidebarCollapsed: false,
  focusMode: false,
  commandPaletteOpen: false,
  searchOpen: false,
  selectedFolderId: null,
  currentView: UIView.None,
  previousNoteId: null,

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
    const { currentNote } = useNoteStore.getState();

    // Track previous note when navigating to bookmarks
    if (view === UIView.Bookmarks && currentNote) {
      set({ previousNoteId: currentNote.id });
    } else if (view === UIView.None && get().previousNoteId) {
      // Clear previous note when going back to editor
      set({ previousNoteId: null });
    }

    set({ currentView: view });
    // Only clear currentNote when switching to Settings, StickyNotes, or Bookmarks view
    // Don't clear when switching to None (editor view) to prevent flicker
    if (
      view === UIView.Settings ||
      view === UIView.StickyNotes ||
      view === UIView.Bookmarks
    ) {
      useNoteStore.setState({ currentNote: null });
    }
    // Persist view change (preserve existing parentPath)
    const savedState = loadAppState();
    saveAppState({
      currentNoteId: currentNote?.id || null,
      currentView: view ? String(view) : null,
      selectedFolderId: get().selectedFolderId,
      parentPath: savedState.parentPath || [],
    });
  },

  setPreviousNoteId: (id: string | null) => {
    set({ previousNoteId: id });
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
