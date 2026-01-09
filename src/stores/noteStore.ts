import { create } from "zustand";
import type {
  Note,
  NoteMetadata,
  Folder,
  SearchResult,
} from "../lib/tauri/commands";
import * as commands from "../lib/tauri/commands";

// Re-export UIView from UI store for backward compatibility
export { UIView } from "./uiStore";

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

  // Search actions
  search: (query: string) => Promise<void>;
  clearSearch: () => void;

  // Export actions
  exportCurrentNote: (destination: string) => Promise<void>;

  // Import actions
  importFile: (filePath: string, folderId?: string | null) => Promise<Note>;
}

// Save operation tracker outside of Zustand store to prevent race conditions
let activeSaveOperation: Promise<void> | null = null;
let activeSafetyTimeout: ReturnType<typeof setTimeout> | null = null;

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

  // Note actions
  loadNotes: async (folderId, parentId) => {
    set({ isLoading: true, error: null });
    try {
      const notes = await Promise.race([
        commands.listNotes(folderId ?? undefined, parentId ?? undefined),
        new Promise<NoteMetadata[]>((_, reject) =>
          setTimeout(
            () => reject(new Error("listNotes timeout after 5s")),
            5000
          )
        ),
      ]);

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
      console.log("error", error);
      set({ error: String(error), isLoading: false });
    }
  },

  loadNote: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const note = await commands.getNote(id);
      if (!note) {
        set({ error: "Note not found", isLoading: false });
        return;
      }
      set({
        currentNote: note,
        isLoading: false,
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createNote: async (title, folderId, parentId) => {
    const { notes, childrenMap } = get();

    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const now = Date.now();
    const tempMetadata = {
      id: tempId,
      title,
      preview: null,
      folder_id: folderId || null,
      parent_id: parentId || null,
      pinned: false,
      children_count: 0,
      created_at: now,
      updated_at: now,
    };

    // Optimistic update - add to UI immediately
    if (parentId) {
      const newMap = new Map(childrenMap);
      const parentChildren = newMap.get(parentId) || [];
      newMap.set(parentId, [tempMetadata, ...parentChildren]);
      set({ childrenMap: newMap, isLoading: false });
    } else {
      set({ notes: [tempMetadata, ...notes], isLoading: false });
    }

    try {
      const note = await commands.createNote({
        title,
        folder_id: folderId,
        parent_id: parentId,
      });

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

      // Replace temp with real data
      if (parentId) {
        const newMap = new Map(get().childrenMap);
        const parentChildren = newMap.get(parentId) || [];
        const updatedChildren = parentChildren.map((n) =>
          n.id === tempId ? metadata : n
        );
        newMap.set(parentId, updatedChildren);
        set({
          childrenMap: newMap,
          currentNote: note,
          isLoading: false,
        });
      } else {
        // Replace temp with real data in notes list
        const updatedNotes = get().notes.map((n) =>
          n.id === tempId ? metadata : n
        );
        set({
          notes: updatedNotes,
          currentNote: note,
          isLoading: false,
        });
      }
      return note;
    } catch (error) {
      // Rollback optimistic update on error
      if (parentId) {
        const newMap = new Map(get().childrenMap);
        const parentChildren = newMap.get(parentId) || [];
        const rolledBack = parentChildren.filter((n) => n.id !== tempId);
        newMap.set(parentId, rolledBack);
        set({ childrenMap: newMap, error: String(error), isLoading: false });
      } else {
        const rolledBack = get().notes.filter((n) => n.id !== tempId);
        set({ notes: rolledBack, error: String(error), isLoading: false });
      }
      throw error;
    }
  },

  createSubpage: async (parentId, title) => {
    set({ isLoading: true, error: null });
    try {
      const note = await commands.createSubpage(parentId, title);

      // Reload the full note data from database to ensure we have correct content
      const fullNote = await commands.getNote(note.id);
      if (!fullNote) {
        throw new Error("Failed to load created sub-page");
      }

      const { childrenMap, expandedPages, loadedChildren } = get();
      const metadata = {
        id: fullNote.id,
        title: fullNote.title,
        preview: null,
        folder_id: fullNote.folder_id,
        parent_id: fullNote.parent_id,
        pinned: false,
        children_count: 0,
        created_at: fullNote.created_at,
        updated_at: fullNote.updated_at,
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

      // When creating via /page command, don't switch to the sub-page - stay on parent
      // The sub-page will be created and linked, but user stays on parent
      const { currentNote } = get();
      set({
        childrenMap: newMap,
        notes: updatedNotes,
        expandedPages: newExpanded,
        loadedChildren: newLoaded,
        // Don't change currentNote - keep user on parent page
        currentNote: currentNote, // Keep current note unchanged
        isLoading: false,
      });
      return fullNote;
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
            ? {
                ...n,
                title: note.title,
                updated_at: note.updated_at,
                parent_id: note.parent_id,
              }
            : n
        );
        if (updatedChildren.some((n) => n.id === id)) {
          newMap.set(parentId, updatedChildren);
        }
      }

      // Also check if the note's parent_id changed and move it to the correct parent
      const oldNote = notes.find((n) => n.id === id);
      if (oldNote && oldNote.parent_id !== note.parent_id) {
        // Remove from old parent
        if (oldNote.parent_id) {
          const oldParentChildren = newMap.get(oldNote.parent_id) || [];
          newMap.set(
            oldNote.parent_id,
            oldParentChildren.filter((n) => n.id !== id)
          );
        }
        // Add to new parent
        if (note.parent_id) {
          const newParentChildren = newMap.get(note.parent_id) || [];
          const metadata = {
            id: note.id,
            title: note.title,
            preview: oldNote.preview,
            folder_id: note.folder_id,
            parent_id: note.parent_id,
            pinned: oldNote.pinned,
            children_count: oldNote.children_count,
            created_at: oldNote.created_at,
            updated_at: note.updated_at,
          };
          newMap.set(note.parent_id, [metadata, ...newParentChildren]);
        }
      }

      set({ childrenMap: newMap });

      // Sort by updated_at desc
      updatedNotes.sort((a, b) => b.updated_at - a.updated_at);

      set({
        notes: updatedNotes,
        childrenMap: newMap,
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
    const { currentNote, notes, childrenMap } = get();
    if (!currentNote) {
      console.log("[saveCurrentNoteContent] No current note, returning early");
      return;
    }

    // Prevent concurrent saves using module-level tracker
    // If a save is already in progress, wait for it to complete first
    if (activeSaveOperation) {
      console.warn(
        "[saveCurrentNoteContent] Save already in progress, waiting for completion",
        {
          noteId: currentNote.id,
          timestamp: new Date().toISOString(),
        }
      );
      try {
        await activeSaveOperation;
      } catch (error) {}
    }

    // Check if another save started while we were waiting
    const currentState = get();
    if (currentState.isSaving) {
      console.warn(
        "[saveCurrentNoteContent] Save still in progress after waiting, aborting"
      );
      return;
    }

    // Set isSaving flag BEFORE creating the promise to ensure atomicity
    set({ isSaving: true });

    // Create the save operation promise
    const saveOperation = (async () => {
      // Log after setting the flag

      // Safety timeout: ensure isSaving is reset even if save hangs
      // Clear any previous safety timeout
      if (activeSafetyTimeout) {
        clearTimeout(activeSafetyTimeout);
      }

      activeSafetyTimeout = setTimeout(() => {
        const currentState = get();
        if (currentState.isSaving) {
          console.warn(
            "[saveCurrentNoteContent] SAFETY TIMEOUT: Save took too long, resetting isSaving",
            {
              noteId: currentNote.id,
              elapsed: "5s",
              timestamp: new Date().toISOString(),
            }
          );
          set({ isSaving: false });
        }
        activeSafetyTimeout = null;
      }, 5000); // 5 seconds should be more than enough for any save

      try {
        const updatedAt = await commands.saveNoteContent(
          currentNote.id,
          content
        );

        // Clear safety timeout since save completed
        if (activeSafetyTimeout) {
          clearTimeout(activeSafetyTimeout);
          activeSafetyTimeout = null;
        }

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

        // Update childrenMap if this note is a child
        const newMap = new Map(childrenMap);
        for (const [parentId, children] of newMap.entries()) {
          const updatedChildren = children.map((n) =>
            n.id === currentNote.id ? { ...n, updated_at: updatedAt } : n
          );
          if (updatedChildren.some((n) => n.id === currentNote.id)) {
            newMap.set(parentId, updatedChildren);
          }
        }

        set({ notes: updatedNotes, childrenMap: newMap });
      } catch (error) {
        console.error("[saveCurrentNoteContent] Save failed with error", {
          noteId: currentNote.id,
          error: String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        });

        // Clear safety timeout on error
        if (activeSafetyTimeout) {
          clearTimeout(activeSafetyTimeout);
          activeSafetyTimeout = null;
        }
        set({ error: String(error), isSaving: false });
        console.log(
          "[saveCurrentNoteContent] Set isSaving: false (after error)"
        );
      }
    })();

    // Track the active save operation
    activeSaveOperation = saveOperation;

    // Execute and clear the tracker when done
    try {
      await saveOperation;
    } finally {
      activeSaveOperation = null;
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
      const { folders } = get();
      set({
        folders: folders.filter((f) => f.id !== id),
      });
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
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
