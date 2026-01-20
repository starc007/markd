import { create } from "zustand";
import { toast } from "sonner";
import type {
  Note,
  NoteMetadata,
  Folder,
  SearchResult,
  TrashedNoteMetadata,
} from "../lib/tauri/commands";
import * as commands from "../lib/tauri/commands";

import { useTabStore } from "./tabStore";

// Re-export UIView from UI store for backward compatibility
export { UIView } from "./uiStore";

interface NoteStore {
  // State
  notes: NoteMetadata[];
  folders: Folder[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  searchResults: SearchResult[];
  searchQuery: string;
  // Hierarchy state
  childrenMap: Map<string, NoteMetadata[]>; // parent_id -> children
  expandedPages: Set<string>; // Set of expanded page IDs
  loadedChildren: Set<string>; // Pages whose children have been loaded
  loadingChildren: Set<string>; // Pages currently being loaded (prevents concurrent requests)
  // Track newly created notes for auto-focus
  newlyCreatedNoteId: string | null;

  // Note actions
  loadNotes: (
    folderId?: string | null,
    parentId?: string | null,
  ) => Promise<void>;
  loadNote: (id: string) => Promise<void>; // Opens note in tab
  createNote: (
    title: string,
    folderId?: string,
  ) => Promise<Note>;
  createSubpage: (parentId: string, title: string, options?: { skipOpenTab?: boolean }) => Promise<Note>;
  updateNote: (
    id: string,
    updates: { title?: string; content?: string; banner_type?: string | null },
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

  // Trash actions
  trashedNotes: TrashedNoteMetadata[];
  isLoadingTrash: boolean;
  loadTrashedNotes: () => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  permanentlyDeleteNote: (id: string) => Promise<void>;
  permanentlyDeleteAllTrashedNotes: () => Promise<void>;
}

// Helper function to refresh a note's metadata (including children_count)
async function refreshNoteMetadata(
  noteId: string,
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
  isLoading: false,
  isSaving: false,
  error: null,
  searchResults: [],
  searchQuery: "",
  childrenMap: new Map(),
  expandedPages: new Set(),
  loadedChildren: new Set(),
  loadingChildren: new Set(),
  newlyCreatedNoteId: null,
  // Trash state
  trashedNotes: [],
  isLoadingTrash: false,

  // Note actions
  loadNotes: async (folderId, parentId) => {
    set({ isLoading: true, error: null });
    try {
      const notes = await Promise.race([
        commands.listNotes(folderId ?? undefined, parentId ?? undefined),
        new Promise<NoteMetadata[]>((_, reject) =>
          setTimeout(
            () => reject(new Error("listNotes timeout after 5s")),
            5000,
          ),
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
    // Open note in tab (will switch if already open)
    const { openTab } = useTabStore.getState();
    await openTab(id);

    // Expand parent pages in the background (non-blocking)
    try {
      const note = await commands.getNote(id);
      if (!note) {
        return;
      }

      if (note.parent_id) {
        get()
          .getParentPath(id)
          .then((parentPath) => {
            if (parentPath.length > 0) {
              get().expandParentPages(parentPath);
            }
          })
          .catch((error) => {
            console.error("[loadNote] Failed to get parent path:", error);
          });
      }
    } catch (error) {
      console.error("[loadNote] Failed to load note:", error);
    }
  },

  createNote: async (title, folderId) => {
    const { notes } = get();

    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const now = Date.now();
    const tempMetadata = {
      id: tempId,
      title,
      preview: null,
      folder_id: folderId || null,
      parent_id: null, // Always root-level
      pinned: false,
      children_count: 0,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    };

    // Optimistic update - add to UI immediately (root-level notes only)
    // Note: tempMetadata already has deleted_at: null
    set({ notes: [tempMetadata, ...notes], isLoading: false });

    try {
      const note = await commands.createNote({
        title,
        folder_id: folderId,
        // parent_id is omitted - always root-level
      });

      const metadata = {
        id: note.id,
        title: note.title,
        preview: null,
        folder_id: note.folder_id,
        parent_id: null, // Always root-level
        pinned: false,
        children_count: 0,
        deleted_at: note.deleted_at,
        created_at: note.created_at,
        updated_at: note.updated_at,
      };

      // Replace temp with real data in notes list
      const updatedNotes = get().notes.map((n) =>
        n.id === tempId ? metadata : n,
      );
      set({
        notes: updatedNotes,
        isLoading: false,
        newlyCreatedNoteId: note.id, // Mark as newly created for auto-focus
      });
      // Open in tab
      const { openTab } = useTabStore.getState();
      await openTab(note.id);
      return note;
    } catch (error) {
      // Rollback optimistic update on error
      const rolledBack = get().notes.filter((n) => n.id !== tempId);
      set({ notes: rolledBack, error: String(error), isLoading: false });
      throw error;
    }
  },

  createSubpage: async (parentId, title, options = {}) => {
    const { skipOpenTab = false } = options;
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
        deleted_at: fullNote.deleted_at,
        created_at: fullNote.created_at,
        updated_at: fullNote.updated_at,
      };

      // Add to parent's children
      const newMap = new Map(childrenMap);
      const parentChildren = newMap.get(parentId) || [];
      newMap.set(parentId, [metadata, ...parentChildren]);

      // Refresh parent's metadata from DB to get accurate children_count
      // First check if parent is in notes (root-level) or childrenMap (nested)
      const parentInNotes = notes.find((n) => n.id === parentId);
      let parentParentId: string | null = null;
      
      // Find parent in childrenMap to get its parent_id
      for (const [, children] of childrenMap.entries()) {
        const found = children.find((n) => n.id === parentId);
        if (found) {
          parentParentId = found.parent_id;
          break;
        }
      }
      
      // If parent is root-level, use refreshNoteMetadata
      // If nested, get it from its parent's children
      let refreshedParent: NoteMetadata | null = null;
      if (parentInNotes) {
        refreshedParent = await refreshNoteMetadata(parentId);
      } else if (parentParentId) {
        // Parent is nested - get refreshed metadata from its parent's children
        try {
          const parentChildren = await commands.getPageChildren(parentParentId);
          refreshedParent = parentChildren.find((n) => n.id === parentId) || null;
        } catch (error) {
          console.error("[createSubpage] Failed to get parent children:", error);
        }
      }
      
      let updatedNotes = notes;
      if (refreshedParent) {
        // Determine if parent is root-level or nested based on its parent_id
        if (refreshedParent.parent_id === null) {
          // Parent is root-level - update in notes array
          updatedNotes = notes.map((n) =>
            n.id === parentId ? refreshedParent! : n,
          );
        } else {
          // Parent is nested - update it in childrenMap under its parent
          const parentParentId = refreshedParent.parent_id;
          const children = newMap.get(parentParentId) || [];
          const updatedChildren = children.map((n) =>
            n.id === parentId ? refreshedParent! : n,
          );
          newMap.set(parentParentId, updatedChildren);
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
        isLoading: false,
        newlyCreatedNoteId: fullNote.id, // Mark as newly created for auto-focus
      });
      // Open in tab (unless skipped)
      if (!skipOpenTab) {
        const { openTab } = useTabStore.getState();
        await openTab(fullNote.id);
      }
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
      const { notes } = get();

      // If title was updated, update all page links that reference this page
      if (updates.title !== undefined && updates.title !== null) {
        try {
          // Get backlinks before updating (to know which notes were affected)
          const backlinks = await commands.getBacklinks(id);
          await commands.updatePageLinkTitles(id, note.title);

          // If any open tab is one of the notes that was updated, refresh its content
          // without switching to it (to avoid interrupting the user)
          const { openTabs, activeTabId, updateTabContent } = useTabStore.getState();
          for (const tab of openTabs) {
            if (backlinks.includes(tab.id)) {
              // Only refresh content if it's not the currently active tab
              // (to avoid interrupting the user while they're typing)
              if (tab.id !== activeTabId) {
                try {
                  const refreshedNote = await commands.getNote(tab.id);
                  if (refreshedNote) {
                    updateTabContent(tab.id, refreshedNote.content);
                  }
                } catch (error) {
                  console.error(`Failed to refresh tab ${tab.id}:`, error);
                }
              }
              // If it's the active tab, the content will be updated naturally
              // through the normal save/load cycle, so we don't need to do anything
            }
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
          : n,
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
            : n,
        );
        if (updatedChildren.some((n) => n.id === id)) {
          newMap.set(parentId, updatedChildren);
        }
      }

      // Update tab title if tab exists
      const { updateTabTitle, getTab } = useTabStore.getState();
      const tab = getTab(id);
      if (tab) {
        updateTabTitle(id, note.title);
      }

      // Also check if the note's parent_id changed and move it to the correct parent
      const oldNote = notes.find((n) => n.id === id);
      if (oldNote && oldNote.parent_id !== note.parent_id) {
        // Remove from old parent
        if (oldNote.parent_id) {
          const oldParentChildren = newMap.get(oldNote.parent_id) || [];
          newMap.set(
            oldNote.parent_id,
            oldParentChildren.filter((n) => n.id !== id),
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
            deleted_at: oldNote.deleted_at,
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
      // Show toast notification
      toast.success("Note moved to trash");
      
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

      // Close tab if it's open
      const { closeTab, openTabs, activeTabId } = useTabStore.getState();
      const isActiveTab = activeTabId === id;
      if (openTabs.some((tab) => tab.id === id)) {
        closeTab(id);
      }

      const { expandedPages, loadedChildren } = get();

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
        // Check if parent is root-level or nested
        const parentInNotes = updatedNotes.find((n) => n.id === pid);
        let parentParentId: string | null = null;
        
        // Find parent in childrenMap to get its parent_id
        for (const [, children] of newMap.entries()) {
          const found = children.find((n) => n.id === pid);
          if (found) {
            parentParentId = found.parent_id;
            break;
          }
        }
        
        // Get refreshed parent metadata
        let refreshed: NoteMetadata | null = null;
        if (parentInNotes) {
          // Parent is root-level
          refreshed = await refreshNoteMetadata(pid);
        } else if (parentParentId) {
          // Parent is nested - get refreshed metadata from its parent's children
          try {
            const parentChildren = await commands.getPageChildren(parentParentId);
            refreshed = parentChildren.find((n) => n.id === pid) || null;
          } catch (error) {
            console.error("[deleteNote] Failed to get parent children:", error);
          }
        }
        
        if (refreshed) {
          // Update in notes array if root-level
          if (refreshed.parent_id === null) {
            updatedNotes = updatedNotes.map((n) =>
              n.id === pid ? refreshed! : n,
            );
          }
          
          // Update in childrenMap if nested
          if (refreshed.parent_id !== null) {
            const parentParentId = refreshed.parent_id;
            const children = newMap.get(parentParentId) || [];
            const updatedChildren = children.map((n) =>
              n.id === pid ? refreshed! : n,
            );
            newMap.set(parentParentId, updatedChildren);
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

      if (isActiveTab) {
        // We're deleting the active tab
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
        isLoading: false,
      });

      // Refresh trashed notes count immediately
      try {
        await get().loadTrashedNotes();
      } catch (error) {
        console.error("Failed to refresh trashed notes:", error);
        // Don't throw - this is not critical
      }

      // Load the note to navigate to after deletion
      if (noteToNavigate) {
        try {
          // Use loadNote to properly handle state updates, expanding parent pages, etc.
          // loadNote already handles state persistence internally
          await get().loadNote(noteToNavigate);
        } catch (error) {
          console.error("Failed to load note after deletion:", error);
        }
      }
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  saveCurrentNoteContent: async (content) => {
    const { getActiveTab } = useTabStore.getState();
    const activeTab = getActiveTab();
    if (!activeTab) {
      return;
    }

    const noteId = activeTab.id;

    // Set saving flag immediately for UI feedback
    set({ isSaving: true });

    try {
      // Backend queue handles deduplication and batching
      const updatedAt = await commands.saveNoteContent(noteId, content);

      // CRITICAL: Verify we're still on the same note before updating state
      // This prevents race conditions when switching notes quickly
      const { getActiveTab: getActiveTabAfterSave } = useTabStore.getState();
      const activeTabAfterSave = getActiveTabAfterSave();
      if (!activeTabAfterSave || activeTabAfterSave.id !== noteId) {
        // Note was switched during save, don't update state
        set({ isSaving: false });
        return;
      }

      // Update notes list timestamp
      const { notes } = get();
      const updatedNotes = notes.map((n) =>
        n.id === noteId ? { ...n, updated_at: updatedAt } : n,
      );
      updatedNotes.sort((a, b) => b.updated_at - a.updated_at);

      // Update childrenMap if this note is a child
      const { childrenMap } = get();
      const newMap = new Map(childrenMap);
      for (const [parentId, children] of newMap.entries()) {
        const updatedChildren = children.map((n) =>
          n.id === noteId ? { ...n, updated_at: updatedAt } : n,
        );
        if (updatedChildren.some((n) => n.id === noteId)) {
          newMap.set(parentId, updatedChildren);
        }
      }

      // Update tab content and timestamp
      const { updateTabContent } = useTabStore.getState();
      updateTabContent(noteId, content);

      set({ notes: updatedNotes, childrenMap: newMap, isSaving: false });
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
    const { getActiveTab } = useTabStore.getState();
    const activeTab = getActiveTab();
    if (!activeTab) return;

    try {
      // Parse JSON content
      const json = JSON.parse(activeTab.content);

      // Convert to markdown using our utility
      const { jsonToMarkdown } = await import("../lib/tiptap/json-to-markdown");
      const markdown = jsonToMarkdown(json);

      // Export with markdown content
      await commands.exportNote(activeTab.id, destination, markdown);
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
            deleted_at: note.deleted_at,
            created_at: note.created_at,
            updated_at: note.updated_at,
          },
          ...notes,
        ],
        isLoading: false,
      });
      // Open in tab
      const { openTab } = useTabStore.getState();
      await openTab(note.id);
      return note;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // Hierarchy actions
  loadPageChildren: async (parentId) => {
    const { loadedChildren, loadingChildren } = get();

    // Already loaded - skip
    if (loadedChildren.has(parentId)) {
      return;
    }

    // Already loading - skip (prevents concurrent requests for same parent)
    if (loadingChildren.has(parentId)) {
      return;
    }

    // Mark as loading to prevent concurrent requests
    set({ loadingChildren: new Set([...loadingChildren, parentId]) });

    try {
      const children = await commands.getPageChildren(parentId);
      const { childrenMap, loadingChildren: currentLoading } = get();
      const newMap = new Map(childrenMap);
      newMap.set(parentId, children);

      // Remove from loading and add to loaded
      const newLoading = new Set(currentLoading);
      newLoading.delete(parentId);

      set({
        childrenMap: newMap,
        loadedChildren: new Set([...get().loadedChildren, parentId]),
        loadingChildren: newLoading,
      });
    } catch (error) {
      // Remove from loading on error
      const { loadingChildren: currentLoading } = get();
      const newLoading = new Set(currentLoading);
      newLoading.delete(parentId);
      set({ error: String(error), loadingChildren: newLoading });
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
        (n) => n.id === pageId,
      );
      if (!page) return;

      const oldParentId = page.parent_id;

      // Remove from old parent's children
      if (oldParentId) {
        const newMap = new Map(childrenMap);
        const oldChildren = newMap.get(oldParentId) || [];
        newMap.set(
          oldParentId,
          oldChildren.filter((n) => n.id !== pageId),
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
            error,
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
            error,
          );
        }
      }
    }

    // Only update state if something actually changed
    // This prevents unnecessary re-renders that cause scroll position to jump
    // Since we only add items (never remove), size comparison is sufficient
    const expandedChanged = newExpanded.size !== expandedPages.size;
    const loadedChanged = newLoaded.size !== loadedChildren.size;
    const mapChanged = newMap.size !== childrenMap.size;

    if (expandedChanged || loadedChanged || mapChanged) {
      set({
        expandedPages: newExpanded,
        loadedChildren: newLoaded,
        childrenMap: newMap,
      });
    }
  },

  // Trash actions
  loadTrashedNotes: async () => {
    set({ isLoadingTrash: true, error: null });
    try {
      const notes = await commands.listTrashedNotes();
      set({ trashedNotes: notes, isLoadingTrash: false });
    } catch (error) {
      console.error("Failed to load trashed notes:", error);
      toast.error("Failed to load trashed notes");
      set({ error: String(error), isLoadingTrash: false });
    }
  },

  restoreNote: async (id) => {
    try {
      await commands.restoreNote(id);
      toast.success("Note restored");
      
      // Refresh trashed notes count (handles child notes too)
      await get().loadTrashedNotes();

      // Reload notes to show restored note
      const { loadNotes } = get();
      await loadNotes();
    } catch (error) {
      console.error("Failed to restore note:", error);
      toast.error("Failed to restore note");
      throw error;
    }
  },

  permanentlyDeleteNote: async (id) => {
    try {
      await commands.permanentlyDeleteNote(id);
      toast.success("Note permanently deleted");

      // Refresh trashed notes count (handles child notes too)
      await get().loadTrashedNotes();
    } catch (error) {
      console.error("Failed to permanently delete note:", error);
      toast.error("Failed to permanently delete note");
      throw error;
    }
  },

  permanentlyDeleteAllTrashedNotes: async () => {
    const { trashedNotes } = get();
    if (trashedNotes.length === 0) {
      return;
    }

    try {
      // Delete all trashed notes one by one
      for (const note of trashedNotes) {
        await commands.permanentlyDeleteNote(note.id);
      }

      toast.success(`Permanently deleted ${trashedNotes.length} ${trashedNotes.length === 1 ? "note" : "notes"}`);

      // Refresh trashed notes count
      await get().loadTrashedNotes();
    } catch (error) {
      console.error("Failed to permanently delete all notes:", error);
      toast.error("Failed to permanently delete all notes");
      throw error;
    }
  },
}));
