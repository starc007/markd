import { create } from "zustand";
import type {
  Note,
  NoteMetadata,
  Folder,
  SearchResult,
} from "../lib/tauri/commands";
import * as commands from "../lib/tauri/commands";

interface UIState {
  sidebarCollapsed: boolean;
  focusMode: boolean;
  commandPaletteOpen: boolean;
  searchOpen: boolean;
  selectedFolderId: string | null;
  showFavorites: boolean;
}

interface NoteStore {
  // State
  notes: NoteMetadata[];
  folders: Folder[];
  currentNote: Note | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  searchResults: SearchResult[];
  searchQuery: string;
  ui: UIState;

  // Note actions
  loadNotes: (folderId?: string | null) => Promise<void>;
  loadNote: (id: string) => Promise<void>;
  createNote: (title: string, folderId?: string) => Promise<Note>;
  updateNote: (
    id: string,
    updates: { title?: string; content?: string }
  ) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  saveCurrentNoteContent: (content: string) => Promise<void>;

  // Folder actions
  loadFolders: () => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<Folder>;
  updateFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  selectFolder: (id: string | null) => void;

  // Search actions
  search: (query: string) => Promise<void>;
  clearSearch: () => void;

  // UI actions
  toggleSidebar: () => void;
  toggleFocusMode: () => void;
  toggleCommandPalette: () => void;
  toggleSearch: () => void;
  toggleFavorites: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;

  // Export actions
  exportCurrentNote: (destination: string) => Promise<void>;

  // Import actions
  importFile: (filePath: string, folderId?: string | null) => Promise<Note>;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  // Initial state
  notes: [],
  folders: [],
  currentNote: null,
  isLoading: false,
  isSaving: false,
  error: null,
  searchResults: [],
  searchQuery: "",
  ui: {
    sidebarCollapsed: false,
    focusMode: false,
    commandPaletteOpen: false,
    searchOpen: false,
    selectedFolderId: null,
    showFavorites: false,
  },

  // Note actions
  loadNotes: async (folderId) => {
    set({ isLoading: true, error: null });
    try {
      const notes = await commands.listNotes(folderId);
      set({ notes, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  loadNote: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const note = await commands.getNote(id);
      set({ currentNote: note, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createNote: async (title, folderId) => {
    set({ isLoading: true, error: null });
    try {
      const note = await commands.createNote({
        title,
        content: "",
        folder_id: folderId,
      });
      const { notes } = get();
      set({
        notes: [
          {
            id: note.id,
            title: note.title,
            preview: null,
            folder_id: note.folder_id,
            pinned: false,
            created_at: note.created_at,
            updated_at: note.updated_at,
          },
          ...notes,
        ],
        currentNote: note,
        isLoading: false,
      });
      return note;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  updateNote: async (id, updates) => {
    set({ isSaving: true, error: null });
    try {
      const note = await commands.updateNote({ id, ...updates });
      const { notes, currentNote } = get();

      // Update notes list
      const updatedNotes = notes.map((n) =>
        n.id === id
          ? { ...n, title: note.title, updated_at: note.updated_at }
          : n
      );

      // Sort by updated_at desc
      updatedNotes.sort((a, b) => b.updated_at - a.updated_at);

      set({
        notes: updatedNotes,
        currentNote: currentNote?.id === id ? note : currentNote,
        isSaving: false,
      });
    } catch (error) {
      set({ error: String(error), isSaving: false });
      throw error;
    }
  },

  deleteNote: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await commands.deleteNote(id);
      const { notes, currentNote } = get();
      const updatedNotes = notes.filter((n) => n.id !== id);
      set({
        notes: updatedNotes,
        currentNote: currentNote?.id === id ? null : currentNote,
        isLoading: false,
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  saveCurrentNoteContent: async (content) => {
    const { currentNote } = get();
    if (!currentNote) return;

    set({ isSaving: true });
    try {
      const updatedAt = await commands.saveNoteContent(currentNote.id, content);
      const { notes } = get();

      // Update current note
      set({
        currentNote: { ...currentNote, content, updated_at: updatedAt },
        isSaving: false,
      });

      // Update notes list timestamp
      const updatedNotes = notes.map((n) =>
        n.id === currentNote.id ? { ...n, updated_at: updatedAt } : n
      );
      updatedNotes.sort((a, b) => b.updated_at - a.updated_at);
      set({ notes: updatedNotes });
    } catch (error) {
      set({ error: String(error), isSaving: false });
    }
  },

  // Folder actions
  loadFolders: async () => {
    try {
      const folders = await commands.listFolders();
      set({ folders });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  createFolder: async (name, parentId) => {
    try {
      const folder = await commands.createFolder({ name, parent_id: parentId });
      const { folders } = get();
      set({ folders: [...folders, folder] });
      return folder;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  updateFolder: async (id, name) => {
    try {
      const folder = await commands.updateFolder({ id, name });
      const { folders } = get();
      set({
        folders: folders.map((f) => (f.id === id ? folder : f)),
      });
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  deleteFolder: async (id) => {
    try {
      await commands.deleteFolder(id);
      const { folders, ui } = get();
      set({
        folders: folders.filter((f) => f.id !== id),
        ui: ui.selectedFolderId === id ? { ...ui, selectedFolderId: null } : ui,
      });
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  selectFolder: (id) => {
    const { ui, loadNotes } = get();
    set({ ui: { ...ui, selectedFolderId: id } });
    loadNotes(id);
  },

  // Search actions
  search: async (query) => {
    set({ searchQuery: query });
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      const results = await commands.searchNotes(query);
      set({ searchResults: results });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  clearSearch: () => {
    set({ searchQuery: "", searchResults: [] });
  },

  // UI actions
  toggleSidebar: () => {
    const { ui } = get();
    set({ ui: { ...ui, sidebarCollapsed: !ui.sidebarCollapsed } });
  },

  // Focus mode just toggles sidebar visibility
  toggleFocusMode: () => {
    const { ui } = get();
    set({ ui: { ...ui, sidebarCollapsed: !ui.sidebarCollapsed } });
  },

  toggleCommandPalette: () => {
    const { ui } = get();
    set({ ui: { ...ui, commandPaletteOpen: !ui.commandPaletteOpen } });
  },

  toggleSearch: () => {
    const { ui } = get();
    set({ ui: { ...ui, searchOpen: !ui.searchOpen } });
  },

  setCommandPaletteOpen: (open) => {
    const { ui } = get();
    set({ ui: { ...ui, commandPaletteOpen: open } });
  },

  setSearchOpen: (open) => {
    const { ui } = get();
    set({ ui: { ...ui, searchOpen: open } });
  },

  toggleFavorites: () => {
    const { ui } = get();
    set({
      ui: { ...ui, showFavorites: !ui.showFavorites, selectedFolderId: null },
    });
  },

  // Export actions
  exportCurrentNote: async (destination) => {
    const { currentNote } = get();
    if (!currentNote) return;

    try {
      await commands.exportNote(currentNote.id, destination);
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  // Import actions
  importFile: async (filePath, folderId) => {
    set({ isLoading: true, error: null });
    try {
      const note = await commands.importFile(filePath, folderId);
      const { notes } = get();
      set({
        notes: [
          {
            id: note.id,
            title: note.title,
            preview: null,
            folder_id: note.folder_id,
            pinned: false,
            created_at: note.created_at,
            updated_at: note.updated_at,
          },
          ...notes,
        ],
        currentNote: note,
        isLoading: false,
      });
      return note;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },
}));
