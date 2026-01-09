import { create } from "zustand";
import type {
  Note,
  NoteMetadata,
  Folder,
  SearchResult,
} from "../lib/tauri/commands";
import * as commands from "../lib/tauri/commands";

export enum UIView {
  Notes = "notes",
  StickyNotes = "sticky_notes",
  Settings = "settings",
  None = "idle",
}

interface UIState {
  sidebarCollapsed: boolean;
  focusMode: boolean;
  commandPaletteOpen: boolean;
  searchOpen: boolean;
  selectedFolderId: string | null;
  currentView: UIView | null;
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
  // Hierarchy state
  childrenMap: Map<string, NoteMetadata[]>; // parent_id -> children
  expandedPages: Set<string>; // Set of expanded page IDs
  loadedChildren: Set<string>; // Pages whose children have been loaded

  // Note actions
  loadNotes: (
    folderId?: string | null,
    parentId?: string | null
  ) => Promise<void>;
  loadNote: (id: string) => Promise<void>;
  createNote: (
    title: string,
    folderId?: string,
    parentId?: string
  ) => Promise<Note>;
  createSubpage: (parentId: string, title: string) => Promise<Note>;
  updateNote: (
    id: string,
    updates: { title?: string; content?: string }
  ) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  saveCurrentNoteContent: (content: string) => Promise<void>;
  // Hierarchy actions
  loadPageChildren: (parentId: string) => Promise<void>;
  togglePageExpanded: (pageId: string) => void;
  movePage: (pageId: string, newParentId?: string | null) => Promise<void>;

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
  setView: (view: UIView) => void;

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
  childrenMap: new Map(),
  expandedPages: new Set(),
  loadedChildren: new Set(),
  ui: {
    sidebarCollapsed: false,
    focusMode: false,
    commandPaletteOpen: false,
    searchOpen: false,
    selectedFolderId: null,
    currentView: UIView.None,
  },

  // Note actions
  loadNotes: async (folderId, parentId) => {
    set({ isLoading: true, error: null });
    try {
      const notes = await commands.listNotes(folderId, parentId);
      if (parentId) {
        // Loading children for a specific parent
        const { childrenMap } = get();
        const newMap = new Map(childrenMap);
        newMap.set(parentId, notes);
        set({
          childrenMap: newMap,
          loadedChildren: new Set([...get().loadedChildren, parentId]),
          isLoading: false,
        });
      } else {
        // Loading top-level notes
        set({ notes, isLoading: false });
      }
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  loadNote: async (id) => {
    const { ui } = get();
    set({ isLoading: true, error: null });
    try {
      const note = await commands.getNote(id);
      set({
        currentNote: note,
        isLoading: false,
        ui: { ...ui, currentView: UIView.None },
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createNote: async (title, folderId, parentId) => {
    set({ isLoading: true, error: null });
    try {
      const note = await commands.createNote({
        title,
        content: "",
        folder_id: folderId,
        parent_id: parentId,
      });
      const { notes, ui, childrenMap } = get();
      const metadata = {
        id: note.id,
        title: note.title,
        preview: null,
        folder_id: note.folder_id,
        parent_id: note.parent_id,
        pinned: false,
        children_count: 0,
        created_at: note.created_at,
        updated_at: note.updated_at,
      };

      if (parentId) {
        // Add to parent's children
        const newMap = new Map(childrenMap);
        const parentChildren = newMap.get(parentId) || [];
        newMap.set(parentId, [metadata, ...parentChildren]);
        set({
          childrenMap: newMap,
          currentNote: note,
          isLoading: false,
          ui: { ...ui, currentView: UIView.None },
        });
      } else {
        // Add to top-level notes
        set({
          notes: [metadata, ...notes],
          currentNote: note,
          isLoading: false,
          ui: { ...ui, currentView: UIView.None },
        });
      }
      return note;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  createSubpage: async (parentId, title) => {
    set({ isLoading: true, error: null });
    try {
      const note = await commands.createSubpage(parentId, title);
      const { childrenMap, ui, expandedPages, loadedChildren } = get();
      const metadata = {
        id: note.id,
        title: note.title,
        preview: null,
        folder_id: note.folder_id,
        parent_id: note.parent_id,
        pinned: false,
        children_count: 0,
        created_at: note.created_at,
        updated_at: note.updated_at,
      };

      // Add to parent's children
      const newMap = new Map(childrenMap);
      const parentChildren = newMap.get(parentId) || [];
      newMap.set(parentId, [metadata, ...parentChildren]);

      // Update parent's children_count in notes list if visible
      const { notes } = get();
      const updatedNotes = notes.map((n) =>
        n.id === parentId ? { ...n, children_count: n.children_count + 1 } : n
      );

      // Update parent's children_count in childrenMap if it's a child itself
      for (const [parentIdKey, children] of newMap.entries()) {
        const updatedChildren = children.map((n) =>
          n.id === parentId ? { ...n, children_count: n.children_count + 1 } : n
        );
        if (updatedChildren.some((n) => n.id === parentId)) {
          newMap.set(parentIdKey, updatedChildren);
        }
      }

      // Automatically expand parent and mark as loaded so subpage is visible
      const newExpanded = new Set(expandedPages);
      newExpanded.add(parentId);
      const newLoaded = new Set(loadedChildren);
      newLoaded.add(parentId);

      set({
        childrenMap: newMap,
        notes: updatedNotes,
        expandedPages: newExpanded,
        loadedChildren: newLoaded,
        currentNote: note,
        isLoading: false,
        ui: { ...ui, currentView: UIView.None },
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
          ? {
              ...n,
              title: note.title,
              updated_at: note.updated_at,
              parent_id: note.parent_id,
            }
          : n
      );

      // Update in children map if it's a child
      const { childrenMap } = get();
      const newMap = new Map(childrenMap);
      for (const [parentId, children] of newMap.entries()) {
        const updatedChildren = children.map((n) =>
          n.id === id
            ? { ...n, title: note.title, updated_at: note.updated_at }
            : n
        );
        if (updatedChildren.some((n) => n.id === id)) {
          newMap.set(parentId, updatedChildren);
        }
      }
      set({ childrenMap: newMap });

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
      const { notes, currentNote, childrenMap, expandedPages, loadedChildren } =
        get();

      // Remove from top-level notes
      const updatedNotes = notes.filter((n) => n.id !== id);

      // Remove from children map and update parent's children_count
      const newMap = new Map(childrenMap);

      for (const [parentIdKey, children] of newMap.entries()) {
        const filtered = children.filter((n) => n.id !== id);
        if (filtered.length !== children.length) {
          newMap.set(parentIdKey, filtered);

          // Update parent's children_count in notes list
          const parentNote = updatedNotes.find((n) => n.id === parentIdKey);
          if (parentNote) {
            const parentIndex = updatedNotes.indexOf(parentNote);
            updatedNotes[parentIndex] = {
              ...parentNote,
              children_count: Math.max(0, parentNote.children_count - 1),
            };
          }
        }
      }

      // Clean up expandedPages and loadedChildren for the deleted note
      const newExpanded = new Set(expandedPages);
      newExpanded.delete(id);
      const newLoaded = new Set(loadedChildren);
      newLoaded.delete(id);

      set({
        notes: updatedNotes,
        childrenMap: newMap,
        expandedPages: newExpanded,
        loadedChildren: newLoaded,
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
    loadNotes(id, null);
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

  // Focus mode hides all UI chrome (sidebar, title bar, etc.) for distraction-free writing
  toggleFocusMode: () => {
    const { ui } = get();
    set({
      ui: {
        ...ui,
        focusMode: !ui.focusMode,
        // In focus mode, also hide sidebar
        sidebarCollapsed: !ui.focusMode ? true : ui.sidebarCollapsed,
      },
    });
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

  setView: (view: UIView | null) => {
    const { ui } = get();
    // When setting view to null or Notes, keep currentNote if it exists
    // When setting to other views, clear currentNote
    const shouldClearNote =
      view !== null && view !== UIView.Notes && view !== UIView.None;
    set({
      ui: { ...ui, currentView: view },
      currentNote: shouldClearNote ? null : get().currentNote,
    });
  },

  // Export actions
  exportCurrentNote: async (destination) => {
    const { currentNote } = get();
    if (!currentNote) return;

    try {
      // Parse JSON content
      const json = JSON.parse(currentNote.content);

      // Convert to markdown using our utility
      const { jsonToMarkdown } = await import("../lib/tiptap/json-to-markdown");
      const markdown = jsonToMarkdown(json);

      // Export with markdown content
      await commands.exportNote(currentNote.id, destination, markdown);
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
            parent_id: note.parent_id,
            pinned: false,
            children_count: 0,
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

  // Hierarchy actions
  loadPageChildren: async (parentId) => {
    const { loadedChildren } = get();
    if (loadedChildren.has(parentId)) {
      return; // Already loaded
    }

    try {
      const children = await commands.getPageChildren(parentId);
      const { childrenMap } = get();
      const newMap = new Map(childrenMap);
      newMap.set(parentId, children);
      set({
        childrenMap: newMap,
        loadedChildren: new Set([...loadedChildren, parentId]),
      });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  togglePageExpanded: (pageId) => {
    const { expandedPages, loadPageChildren } = get();
    const newExpanded = new Set(expandedPages);

    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
      // Load children if not already loaded
      loadPageChildren(pageId);
    }

    set({ expandedPages: newExpanded });
  },

  movePage: async (pageId, newParentId) => {
    try {
      await commands.movePage(pageId, newParentId);
      // Reload affected pages
      const { notes, childrenMap } = get();

      // Find the page being moved
      const page = [...notes, ...Array.from(childrenMap.values()).flat()].find(
        (n) => n.id === pageId
      );
      if (!page) return;

      const oldParentId = page.parent_id;

      // Remove from old parent's children
      if (oldParentId) {
        const newMap = new Map(childrenMap);
        const oldChildren = newMap.get(oldParentId) || [];
        newMap.set(
          oldParentId,
          oldChildren.filter((n) => n.id !== pageId)
        );
        set({ childrenMap: newMap });
      } else {
        // Remove from top-level notes
        set({ notes: notes.filter((n) => n.id !== pageId) });
      }

      // Reload the new parent's children if it was expanded
      const { expandedPages } = get();
      if (newParentId && expandedPages.has(newParentId)) {
        get().loadPageChildren(newParentId);
      }

      // Reload old parent's children if it was expanded
      if (oldParentId && expandedPages.has(oldParentId)) {
        get().loadPageChildren(oldParentId);
      }
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },
}));
