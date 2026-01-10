import { create } from "zustand";
import type { Bookmark, BookmarkMetadata } from "../lib/tauri/commands";
import * as commands from "../lib/tauri/commands";

interface BookmarkStore {
  // State
  bookmarks: BookmarkMetadata[];
  currentBookmark: Bookmark | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadBookmarks: (folderId?: string | null) => Promise<void>;
  loadBookmark: (id: string) => Promise<void>;
  createBookmark: (
    url: string,
    title: string,
    description?: string,
    tags?: string,
    folderId?: string
  ) => Promise<Bookmark>;
  updateBookmark: (
    id: string,
    updates: { title?: string; description?: string; tags?: string }
  ) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  openBookmark: (url: string) => Promise<void>;
  copyBookmarkUrl: (url: string) => void;
}

export const useBookmarkStore = create<BookmarkStore>((set, get) => ({
  // Initial state
  bookmarks: [],
  currentBookmark: null,
  isLoading: false,
  error: null,

  // Actions
  loadBookmarks: async (folderId) => {
    set({ isLoading: true, error: null });
    try {
      const bookmarks = await commands.listBookmarks(folderId ?? undefined);
      set({ bookmarks, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  loadBookmark: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const bookmark = await commands.getBookmark(id);
      if (!bookmark) {
        set({ error: "Bookmark not found", isLoading: false });
        return;
      }
      set({ currentBookmark: bookmark, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createBookmark: async (url, title, description, tags, folderId) => {
    const { bookmarks } = get();

    set({ isLoading: true, error: null });
    try {
      const bookmark = await commands.createBookmark(
        url,
        title,
        description,
        tags,
        folderId
      );

      // Add to bookmarks list
      set({
        bookmarks: [bookmark, ...bookmarks],
        isLoading: false,
      });

      return bookmark;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  updateBookmark: async (id, updates) => {
    const { bookmarks, currentBookmark } = get();

    set({ isLoading: true, error: null });
    try {
      await commands.updateBookmark(
        id,
        updates.title,
        updates.description,
        updates.tags
      );

      // Update in bookmarks list
      const updatedBookmarks = bookmarks.map((b) =>
        b.id === id
          ? {
              ...b,
              ...updates,
              updated_at: Date.now(),
            }
          : b
      );

      // Update current bookmark if it's the one being updated
      const updatedCurrentBookmark =
        currentBookmark?.id === id
          ? {
              ...currentBookmark,
              ...updates,
              updated_at: Date.now(),
            }
          : currentBookmark;

      set({
        bookmarks: updatedBookmarks,
        currentBookmark: updatedCurrentBookmark,
        isLoading: false,
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  deleteBookmark: async (id) => {
    const { bookmarks, currentBookmark } = get();

    set({ isLoading: true, error: null });
    try {
      await commands.deleteBookmark(id);

      // Remove from bookmarks list
      const updatedBookmarks = bookmarks.filter((b) => b.id !== id);

      // Clear current bookmark if it was deleted
      const updatedCurrentBookmark =
        currentBookmark?.id === id ? null : currentBookmark;

      set({
        bookmarks: updatedBookmarks,
        currentBookmark: updatedCurrentBookmark,
        isLoading: false,
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  openBookmark: async (url) => {
    try {
      // Use Tauri's shell plugin to open URL in default browser
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
    } catch (error) {
      set({ error: `Failed to open bookmark: ${error}` });
      throw error;
    }
  },

  copyBookmarkUrl: (url) => {
    try {
      navigator.clipboard.writeText(url);
    } catch (error) {
      set({ error: `Failed to copy URL: ${error}` });
    }
  },
}));
