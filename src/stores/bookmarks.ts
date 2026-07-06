import { create } from "zustand";
import { toast } from "sonner";
import { ipc } from "@/lib/ipc";
import type { Bookmark } from "@/lib/types";

interface BookmarksState {
  bookmarks: Bookmark[];
  loaded: boolean;
  /** ids with a metadata fetch in flight */
  fetching: Set<string>;
  load: () => Promise<void>;
  add: (url: string) => Promise<void>;
  fetchMeta: (id: string) => Promise<void>;
  updateTitle: (id: string, title: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const oops = (err: unknown) =>
  toast.error(err instanceof Error ? err.message : String(err));

export const useBookmarks = create<BookmarksState>((set, get) => ({
  bookmarks: [],
  loaded: false,
  fetching: new Set<string>(),

  load: async () => {
    try {
      const bookmarks = await ipc.bookmarksList();
      set({ bookmarks, loaded: true });
      // pick up bookmarks whose metadata never arrived (e.g. app closed mid-fetch)
      for (const bookmark of bookmarks) {
        if (!bookmark.metaFetched) get().fetchMeta(bookmark.id);
      }
    } catch (err) {
      oops(err);
    }
  },

  add: async (url) => {
    try {
      const bookmark = await ipc.bookmarkAdd(url);
      set({ bookmarks: [bookmark, ...get().bookmarks] });
      get().fetchMeta(bookmark.id);
    } catch (err) {
      oops(err);
    }
  },

  fetchMeta: async (id) => {
    if (get().fetching.has(id)) return;
    set({ fetching: new Set(get().fetching).add(id) });
    try {
      const updated = await ipc.bookmarkFetchMeta(id);
      set({
        bookmarks: get().bookmarks.map((b) => (b.id === id ? updated : b)),
      });
    } catch {
      // fetch failure already persisted as metaFetched; card offers retry
    } finally {
      const fetching = new Set(get().fetching);
      fetching.delete(id);
      set({ fetching });
    }
  },

  updateTitle: async (id, title) => {
    try {
      const updated = await ipc.bookmarkUpdateTitle(id, title);
      set({
        bookmarks: get().bookmarks.map((b) => (b.id === id ? updated : b)),
      });
    } catch (err) {
      oops(err);
    }
  },

  remove: async (id) => {
    set({ bookmarks: get().bookmarks.filter((b) => b.id !== id) });
    try {
      await ipc.bookmarkDelete(id);
    } catch (err) {
      oops(err);
      get().load();
    }
  },
}));
