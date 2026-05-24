import { create } from "zustand";
import { toast } from "sonner";
import type {
  BookmarkRecord,
  FolderRecord,
  NoteDocument,
  StickyRecord,
  ViewMode,
  WorkspaceManifest,
} from "@/lib/types";
import * as api from "@/lib/workspace-api";
import { titleFromMarkdown } from "@/lib/format";

interface WorkspaceState {
  ready: boolean;
  saving: boolean;
  rootPath: string;
  manifest: WorkspaceManifest | null;
  activeNote: NoteDocument | null;
  openNotes: NoteDocument[];
  view: ViewMode;
  commandOpen: boolean;
  theme: "light" | "dark";
  hydrate: () => Promise<void>;
  setView: (view: ViewMode) => void;
  setCommandOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  openNote: (id: string) => Promise<void>;
  closeNote: (id: string) => Promise<void>;
  createNote: (folderId?: string | null, parentId?: string | null) => Promise<void>;
  saveActiveNote: (content: string) => Promise<void>;
  createFolder: (parentId?: string | null) => Promise<FolderRecord | null>;
  saveSticky: (sticky: Partial<StickyRecord> & Pick<StickyRecord, "content" | "color">) => Promise<void>;
  saveBookmark: (bookmark: Partial<BookmarkRecord> & Pick<BookmarkRecord, "title" | "url">) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  ready: false,
  saving: false,
  rootPath: "",
  manifest: null,
  activeNote: null,
  openNotes: [],
  view: "notes",
  commandOpen: false,
  theme: "light",

  hydrate: async () => {
    const snapshot = await api.loadWorkspace();
    const theme =
      window.localStorage.getItem("draft-theme") === "dark" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({
      ready: true,
      rootPath: snapshot.rootPath,
      manifest: snapshot.manifest,
      activeNote: snapshot.activeNote,
      openNotes: snapshot.activeNote ? [snapshot.activeNote] : [],
      theme,
    });
  },

  setView: (view) => set({ view }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setTheme: (theme) => {
    window.localStorage.setItem("draft-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme });
  },

  openNote: async (id) => {
    const note = await api.getNote(id);
    if (!note) return;
    set((state) => ({
      activeNote: note,
      openNotes: state.openNotes.some((item) => item.meta.id === note.meta.id)
        ? state.openNotes.map((item) =>
            item.meta.id === note.meta.id ? note : item,
          )
        : [...state.openNotes, note],
      view: "notes",
    }));
  },

  closeNote: async (id) => {
    const state = get();
    const nextOpenNotes = state.openNotes.filter((note) => note.meta.id !== id);
    const isActive = state.activeNote?.meta.id === id;
    const nextActive = isActive
      ? nextOpenNotes[nextOpenNotes.length - 1] ?? null
      : state.activeNote;
    set({
      openNotes: nextOpenNotes,
      activeNote: nextActive,
      view: nextActive ? "notes" : state.view,
    });
  },

  createNote: async (folderId = null, parentId = null) => {
    const note = await api.upsertNote({
      title: "Untitled",
      content: "# Untitled\n\nStart writing...",
      folderId,
      parentId,
      tags: [],
      pinned: false,
    });
    const snapshot = await api.loadWorkspace();
    set((state) => ({
      activeNote: note,
      openNotes: [
        ...state.openNotes.filter((item) => item.meta.id !== note.meta.id),
        note,
      ],
      manifest: snapshot.manifest,
      view: "notes",
    }));
  },

  saveActiveNote: async (content) => {
    const current = get().activeNote;
    if (!current) return;
    set({ saving: true });
    try {
      const note = await api.upsertNote({
        id: current.meta.id,
        title: titleFromMarkdown(content),
        content,
        folderId: current.meta.folderId,
        parentId: current.meta.parentId,
        tags: current.meta.tags,
        pinned: current.meta.pinned,
      });
      const snapshot = await api.loadWorkspace();
      set((state) => ({
        activeNote: note,
        openNotes: state.openNotes.map((item) =>
          item.meta.id === note.meta.id ? note : item,
        ),
        manifest: snapshot.manifest,
        saving: false,
      }));
    } catch (error) {
      set({ saving: false });
      toast.error(String(error));
    }
  },

  createFolder: async (parentId = null) => {
    const folder = await api.upsertFolder({ name: "New Folder", parentId });
    await get().hydrate();
    return folder;
  },

  saveSticky: async (sticky) => {
    await api.upsertSticky({
      id: sticky.id,
      content: sticky.content,
      color: sticky.color,
    });
    await get().hydrate();
  },

  saveBookmark: async (bookmark) => {
    await api.upsertBookmark({
      id: bookmark.id,
      title: bookmark.title,
      url: bookmark.url,
      folderId: bookmark.folderId ?? null,
      tags: bookmark.tags ?? [],
    });
    await get().hydrate();
  },
}));
