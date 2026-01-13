import { create } from "zustand";
import type {
  Note,
  NoteMetadata,
  Folder,
  SearchResult,
} from "../lib/tauri/commands";
import * as commands from "../lib/tauri/commands";
import { saveAppState } from "../lib/app-state-persistence";
import { useUIStore } from "./uiStore";

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
  // Track newly created notes for auto-focus
  newlyCreatedNoteId: string | null;

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
  expandParentPages: (parentIds: string[]) => Promise<void>;
  getParentPath: (noteId: string) => Promise<string[]>;

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

// Helper function to refresh a note's metadata (including children_count)
async function refreshNoteMetadata(
  noteId: string
): Promise<NoteMetadata | null> {
  try {
    const notes = await commands.listNotes();
    return notes.find((n) => n.id === noteId) || null;
  } catch (error) {
    console.error("[refreshNoteMetadata] Failed:", error);
    return null;
  }
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
  newlyCreatedNoteId: null,

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
    // Don't reload if it's already the current note
    const { currentNote } = get();
    if (currentNote?.id === id) {
      return;
    }

    // Store the original note ID to detect if user switched notes during load
    const originalNoteId = currentNote?.id;

    set({ isLoading: true, error: null });
    try {
      const note = await commands.getNote(id);
      if (!note) {
        set({ error: "Note not found", isLoading: false });
        return;
      }

      // CRITICAL: Double-check we're still loading the same note (prevent race conditions)
      // If user switched notes again while this was loading, don't update state
      const { currentNote: checkNote } = get();
      // Only skip if currentNote exists, is different from what we're loading,
      // AND is different from the original note (meaning user switched to a third note)
      if (checkNote && checkNote.id !== id && checkNote.id !== originalNoteId) {
        // Note was switched again while loading, don't update
        set({ isLoading: false });
        return;
      }

      // Set the note immediately so content updates right away
      // Clear newlyCreatedNoteId if we're loading a different note
      const { newlyCreatedNoteId } = get();
      set({
        currentNote: note,
        isLoading: false,
        // Only keep newlyCreatedNoteId if it matches the loaded note
        newlyCreatedNoteId:
          newlyCreatedNoteId === note.id ? newlyCreatedNoteId : null,
      });

      // Expand parent pages in the background (non-blocking)
      // This ensures the note content is shown immediately
      if (note.parent_id) {
        get()
          .getParentPath(id)
          .then((parentPath) => {
            if (parentPath.length > 0) {
              get().expandParentPages(parentPath);
            }
            // Persist state after parent path is collected
            const { currentView } = useUIStore.getState();
            saveAppState({
              currentNoteId: note.id,
              currentView: currentView ? String(currentView) : null,
              parentPath: parentPath,
            });
          })
          .catch((error) => {
            console.error("[loadNote] Failed to get parent path:", error);
            // Still persist the note even if parent path fails
            const { currentView } = useUIStore.getState();
            saveAppState({
              currentNoteId: note.id,
              currentView: currentView ? String(currentView) : null,
              parentPath: [],
            });
          });
      } else {
        // No parent, just persist the state
        const { currentView } = useUIStore.getState();
        saveAppState({
          currentNoteId: note.id,
          currentView: currentView ? String(currentView) : null,
          parentPath: [],
        });
      }
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
          newlyCreatedNoteId: note.id, // Mark as newly created for auto-focus
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
          newlyCreatedNoteId: note.id, // Mark as newly created for auto-focus
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

      const { childrenMap, expandedPages, loadedChildren, notes } = get();
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

      // Refresh parent's metadata from DB to get accurate children_count
      const refreshedParent = await refreshNoteMetadata(parentId);
      let updatedNotes = notes;
      if (refreshedParent) {
        updatedNotes = notes.map((n) =>
          n.id === parentId ? refreshedParent : n
        );

        // Also update parent in childrenMap if it's a child itself
        for (const [parentIdKey, children] of newMap.entries()) {
          const updatedChildren = children.map((n) =>
            n.id === parentId ? refreshedParent : n
          );
          if (updatedChildren.some((n) => n.id === parentId)) {
            newMap.set(parentIdKey, updatedChildren);
          }
        }
      }

      // Automatically expand parent and mark as loaded so subpage is visible
      const newExpanded = new Set(expandedPages);
      newExpanded.add(parentId);
      const newLoaded = new Set(loadedChildren);
      newLoaded.add(parentId);

      // Set the newly created subpage as the current note so user navigates to it
      set({
        childrenMap: newMap,
        notes: updatedNotes,
        expandedPages: newExpanded,
        loadedChildren: newLoaded,
        currentNote: fullNote, // Navigate to the newly created subpage
        isLoading: false,
        newlyCreatedNoteId: fullNote.id, // Mark as newly created for auto-focus
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

      // If title was updated, update all page links that reference this page
      if (updates.title !== undefined && updates.title !== null) {
        try {
          // Get backlinks before updating (to know which notes were affected)
          const backlinks = await commands.getBacklinks(id);
          await commands.updatePageLinkTitles(id, note.title);

          // If the current note is one of the notes that was updated, reload it
          if (currentNote && backlinks.includes(currentNote.id)) {
            // Reload the current note to get the updated content
            await get().loadNote(currentNote.id);
          }
        } catch (error) {
          console.error("Failed to update page link titles:", error);
          // Don't fail the entire update if this fails
        }
      }

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
      // Find parent before deletion to refresh it later
      const { notes, childrenMap } = get();
      const deletedNote = notes.find((n) => n.id === id);
      let parentId: string | null = null;

      if (!deletedNote) {
        // Check in childrenMap
        for (const children of childrenMap.values()) {
          const found = children.find((n) => n.id === id);
          if (found) {
            parentId = found.parent_id;
            break;
          }
        }
      } else {
        parentId = deletedNote.parent_id;
      }

      await commands.deleteNote(id);
      const { currentNote, expandedPages, loadedChildren } = get();

      // Remove from top-level notes
      let updatedNotes = notes.filter((n) => n.id !== id);

      // Remove from children map
      const newMap = new Map(childrenMap);
      const parentIdsToRefresh: string[] = [];

      for (const [parentIdKey, children] of newMap.entries()) {
        const filtered = children.filter((n) => n.id !== id);
        if (filtered.length !== children.length) {
          newMap.set(parentIdKey, filtered);
          parentIdsToRefresh.push(parentIdKey);
        }
      }

      // Refresh parent's metadata from DB to get accurate children_count
      if (parentId && !parentIdsToRefresh.includes(parentId)) {
        parentIdsToRefresh.push(parentId);
      }

      for (const pid of parentIdsToRefresh) {
        const refreshed = await refreshNoteMetadata(pid);
        if (refreshed) {
          updatedNotes = updatedNotes.map((n) =>
            n.id === pid ? refreshed : n
          );

          // Update in childrenMap
          for (const [mapParentId, children] of newMap.entries()) {
            const updatedChildren = children.map((n) =>
              n.id === pid ? refreshed : n
            );
            if (updatedChildren.some((n) => n.id === pid)) {
              newMap.set(mapParentId, updatedChildren);
            }
          }
        }
      }

      // Clean up expandedPages and loadedChildren for the deleted note
      const newExpanded = new Set(expandedPages);
      newExpanded.delete(id);
      const newLoaded = new Set(loadedChildren);
      newLoaded.delete(id);

      // Determine which note to navigate to after deletion
      let noteToNavigate: string | null = null;

      if (currentNote?.id === id) {
        // We're deleting the currently open note
        if (parentId) {
          // It's a subnote - navigate to parent
          noteToNavigate = parentId;
        } else {
          // It's a root note - find next adjacent note
          // Filter and sort notes by updated_at descending (same as sidebar)
          const filterNotes = (notesList: typeof notes) => {
            const filtered = notesList.filter((n) => n.parent_id === null);
            return filtered.sort((a, b) => {
              const timeDiff = b.updated_at - a.updated_at;
              if (timeDiff !== 0) return timeDiff;
              return a.id.localeCompare(b.id);
            });
          };

          const sortedRootNotes = filterNotes(updatedNotes);
          const originalSorted = filterNotes(notes);

          const deletedIndex = originalSorted.findIndex((n) => n.id === id);

          if (deletedIndex >= 0 && sortedRootNotes.length > 0) {
            // Navigate to the next adjacent note
            // If there's a note after the deleted one (at deletedIndex + 1 in original),
            // it will now be at deletedIndex in the new list
            if (deletedIndex < sortedRootNotes.length) {
              // The note that was after the deleted one (now at deletedIndex)
              noteToNavigate = sortedRootNotes[deletedIndex].id;
            } else {
              // The deleted note was the last one, go to the previous one (now the last)
              noteToNavigate = sortedRootNotes[sortedRootNotes.length - 1].id;
            }
          }
          // If no notes left, noteToNavigate stays null (will show welcome screen)
        }
      }

      // Update state first (remove deleted note from UI)
      set({
        notes: updatedNotes,
        childrenMap: newMap,
        expandedPages: newExpanded,
        loadedChildren: newLoaded,
        currentNote: currentNote?.id === id ? null : currentNote,
        isLoading: false,
      });

      // Load the note to navigate to after deletion
      if (noteToNavigate) {
        try {
          // Use loadNote to properly handle state updates, expanding parent pages, etc.
          // loadNote already handles state persistence internally
          await get().loadNote(noteToNavigate);
        } catch (error) {
          console.error("Failed to load note after deletion:", error);
          // If loading fails, ensure current note is cleared and persist
          set({ currentNote: null });
          const { currentView } = useUIStore.getState();
          saveAppState({
            currentNoteId: null,
            currentView: currentView ? String(currentView) : null,
            parentPath: [],
          });
        }
      } else {
        // No note to navigate to - persist cleared state
        const { currentView } = useUIStore.getState();
        saveAppState({
          currentNoteId: null,
          currentView: currentView ? String(currentView) : null,
          parentPath: [],
        });
      }
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  saveCurrentNoteContent: async (content) => {
    const { currentNote, notes, childrenMap } = get();
    if (!currentNote) {
      return;
    }

    const noteId = currentNote.id;

    // Set saving flag immediately for UI feedback
    set({ isSaving: true });

    try {
      // Backend queue handles deduplication and batching
      const updatedAt = await commands.saveNoteContent(noteId, content);

      // CRITICAL: Verify we're still on the same note before updating state
      // This prevents race conditions when switching notes quickly
      const { currentNote: currentNoteAfterSave } = get();
      if (!currentNoteAfterSave || currentNoteAfterSave.id !== noteId) {
        // Note was switched during save, don't update state
        set({ isSaving: false });
        return;
      }

      // Update local state optimistically
      set({
        currentNote: {
          ...currentNoteAfterSave,
          content,
          updated_at: updatedAt,
        },
        isSaving: false,
      });

      // Update notes list timestamp
      const updatedNotes = notes.map((n) =>
        n.id === noteId ? { ...n, updated_at: updatedAt } : n
      );
      updatedNotes.sort((a, b) => b.updated_at - a.updated_at);

      // Update childrenMap if this note is a child
      const newMap = new Map(childrenMap);
      for (const [parentId, children] of newMap.entries()) {
        const updatedChildren = children.map((n) =>
          n.id === noteId ? { ...n, updated_at: updatedAt } : n
        );
        if (updatedChildren.some((n) => n.id === noteId)) {
          newMap.set(parentId, updatedChildren);
        }
      }

      set({ notes: updatedNotes, childrenMap: newMap });
    } catch (error) {
      console.error("[saveCurrentNoteContent] Save failed:", error);
      set({ error: String(error), isSaving: false });
      throw error;
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

  // Get all parent IDs for a note (from root to direct parent)
  getParentPath: async (noteId) => {
    const { notes, childrenMap } = get();
    const parentPath: string[] = [];
    const visited = new Set<string>(); // Prevent infinite loops

    // Helper to find a note by ID in notes list or childrenMap
    const findNote = (id: string): NoteMetadata | null => {
      const topLevelNote = notes.find((n) => n.id === id);
      if (topLevelNote) return topLevelNote;

      for (const children of childrenMap.values()) {
        const childNote = children.find((n) => n.id === id);
        if (childNote) return childNote;
      }
      return null;
    };

    // Start with the note itself to get its parent_id
    let currentNoteId: string | null = noteId;

    while (currentNoteId && !visited.has(currentNoteId)) {
      visited.add(currentNoteId);

      // Try to find note in local state first
      const note = findNote(currentNoteId);
      if (note) {
        if (note.parent_id) {
          parentPath.push(note.parent_id);
          currentNoteId = note.parent_id;
        } else {
          break; // Reached root
        }
      } else {
        // If not in local state, load from backend
        try {
          const loadedNote = await commands.getNote(currentNoteId);
          if (loadedNote?.parent_id) {
            parentPath.push(loadedNote.parent_id);
            currentNoteId = loadedNote.parent_id;
          } else {
            break; // Reached root or note doesn't exist
          }
        } catch (error) {
          console.error(
            `[getParentPath] Failed to load note ${currentNoteId}:`,
            error
          );
          break;
        }
      }
    }

    // Return path from root to direct parent (reverse the array)
    return parentPath.reverse();
  },

  // Expand all parent pages given an array of parent IDs (from root to direct parent)
  expandParentPages: async (parentIds: string[]) => {
    if (parentIds.length === 0) return;

    const { expandedPages, loadedChildren, childrenMap } = get();

    // Check if we actually need to do anything
    const needsExpansion = parentIds.some((pid) => !expandedPages.has(pid));
    const needsLoading = parentIds.some((pid) => !loadedChildren.has(pid));

    if (!needsExpansion && !needsLoading) {
      return; // Already expanded and loaded, no need to update state
    }

    const newExpanded = new Set(expandedPages);
    const newLoaded = new Set(loadedChildren);
    const newMap = new Map(childrenMap);

    // Process from root to leaf (parentIds is already in root-to-leaf order)
    for (const pid of parentIds) {
      // Expand this parent
      newExpanded.add(pid);

      // Load children if not already loaded
      if (!newLoaded.has(pid)) {
        try {
          const children = await commands.getPageChildren(pid);
          newMap.set(pid, children);
          newLoaded.add(pid);
        } catch (error) {
          console.error(
            `[expandParentPages] Failed to load children for ${pid}:`,
            error
          );
        }
      }
    }

    // Only update state if something actually changed
    // This prevents unnecessary re-renders that cause scroll position to jump
    const expandedChanged =
      newExpanded.size !== expandedPages.size ||
      Array.from(newExpanded).some((id) => !expandedPages.has(id));
    const loadedChanged =
      newLoaded.size !== loadedChildren.size ||
      Array.from(newLoaded).some((id) => !loadedChildren.has(id));

    // Check if childrenMap actually changed
    let mapChanged = false;
    if (newMap.size !== childrenMap.size) {
      mapChanged = true;
    } else {
      for (const [key, newChildren] of newMap.entries()) {
        const oldChildren = childrenMap.get(key);
        if (!oldChildren || oldChildren.length !== newChildren.length) {
          mapChanged = true;
          break;
        }
        // Check if any child IDs changed
        if (oldChildren.some((child, i) => child.id !== newChildren[i]?.id)) {
          mapChanged = true;
          break;
        }
      }
    }

    if (expandedChanged || loadedChanged || mapChanged) {
      set({
        expandedPages: newExpanded,
        loadedChildren: newLoaded,
        childrenMap: newMap,
      });
    }
  },
}));
