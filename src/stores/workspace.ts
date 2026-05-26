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

const OPEN_TABS_KEY = "draft-open-tabs";

function persistOpenTabs(openNotes: NoteDocument[], activeNote: NoteDocument | null) {
  window.localStorage.setItem(
    OPEN_TABS_KEY,
    JSON.stringify({
      activeId: activeNote?.meta.id ?? null,
      ids: openNotes.map((note) => note.meta.id),
    }),
  );
}

interface WorkspaceState {
  ready: boolean;
  saving: boolean;
  rootPath: string;
  manifest: WorkspaceManifest | null;
  activeNote: NoteDocument | null;
  openNotes: NoteDocument[];
  noteIdPendingTitleSelection: string | null;
  view: ViewMode;
  commandOpen: boolean;
  theme: "light" | "dark";
  hydrate: () => Promise<void>;
  setView: (view: ViewMode) => void;
  setCommandOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  clearPendingTitleSelection: () => void;
  openNote: (id: string) => Promise<void>;
  closeNote: (id: string) => Promise<void>;
  createNote: (folderId?: string | null, parentId?: string | null) => Promise<void>;
  createLinkedNote: (title: string) => Promise<NoteDocument>;
  deleteFolder: (id: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  renameFolder: (folder: FolderRecord, name: string) => Promise<void>;
  saveActiveNote: (content: string) => Promise<void>;
  saveActiveTitle: (title: string, content?: string) => Promise<void>;
  toggleTodo: (noteId: string, line: number, done: boolean) => Promise<void>;
  deleteTodo: (noteId: string, line: number) => Promise<void>;
  createFolder: (parentId?: string | null) => Promise<FolderRecord | null>;
  saveSticky: (sticky: Partial<StickyRecord> & Pick<StickyRecord, "content" | "color">) => Promise<void>;
  deleteSticky: (id: string) => Promise<void>;
  saveBookmark: (bookmark: Partial<BookmarkRecord> & Pick<BookmarkRecord, "title" | "url">) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  ready: false,
  saving: false,
  rootPath: "",
  manifest: null,
  activeNote: null,
  openNotes: [],
  noteIdPendingTitleSelection: null,
  view: "notes",
  commandOpen: false,
  theme: "light",

  hydrate: async () => {
    const snapshot = await api.loadWorkspace();
    const theme =
      window.localStorage.getItem("draft-theme") === "dark" ? "dark" : "light";
    const savedTabs = JSON.parse(
      window.localStorage.getItem(OPEN_TABS_KEY) || "null",
    ) as { activeId?: string | null; ids?: string[] } | null;
    const validIds = new Set(snapshot.manifest.notes.map((note) => note.id));
    const tabIds = (savedTabs?.ids ?? [])
      .filter((id) => validIds.has(id))
      .slice(0, 12);
    const openNotes = (
      await Promise.all(tabIds.map((id) => api.getNote(id)))
    ).filter(Boolean) as NoteDocument[];
    const activeNote =
      openNotes.find((note) => note.meta.id === savedTabs?.activeId) ??
      openNotes[0] ??
      snapshot.activeNote;
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({
      ready: true,
      rootPath: snapshot.rootPath,
      manifest: snapshot.manifest,
      activeNote,
      openNotes: openNotes.length ? openNotes : snapshot.activeNote ? [snapshot.activeNote] : [],
      theme,
    });
  },

  setView: (view) => set({ view }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  clearPendingTitleSelection: () => set({ noteIdPendingTitleSelection: null }),
  setTheme: (theme) => {
    window.localStorage.setItem("draft-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme });
  },

  openNote: async (id) => {
    const existing = get().openNotes.find((note) => note.meta.id === id);
    if (existing) {
      set((state) => {
        persistOpenTabs(state.openNotes, existing);
        return { activeNote: existing, view: "notes" };
      });
      return;
    }

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
    persistOpenTabs(get().openNotes, note);
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
    persistOpenTabs(nextOpenNotes, nextActive);
  },

  createNote: async (folderId = null, parentId = null) => {
    const note = await api.upsertNote({
      title: "Untitled",
      content: "",
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
      noteIdPendingTitleSelection: note.meta.id,
      view: "notes",
    }));
    persistOpenTabs(get().openNotes, note);
  },

  createLinkedNote: async (title) => {
    const normalizedTitle = title.trim() || "Untitled";
    const existing = get().manifest?.notes.find(
      (note) => note.title.toLowerCase() === normalizedTitle.toLowerCase(),
    );

    if (existing) {
      const note = await api.getNote(existing.id);
      if (note) return note;
    }

    const note = await api.upsertNote({
      title: normalizedTitle,
      content: "",
      folderId: null,
      parentId: null,
      tags: [],
      pinned: false,
    });
    const snapshot = await api.loadWorkspace();
    set({ manifest: snapshot.manifest });
    return note;
  },

  deleteNote: async (id) => {
    const manifest = await api.deleteNote(id);
    set((state) => {
      const openNotes = state.openNotes.filter((note) => note.meta.id !== id);
      const activeNote =
        state.activeNote?.meta.id === id
          ? openNotes[openNotes.length - 1] ?? null
          : state.activeNote;

      return {
        activeNote,
        manifest,
        openNotes,
        view: activeNote ? "notes" : state.view,
      };
    });
  },

  deleteFolder: async (id) => {
    const manifest = await api.deleteFolder(id);
    set((state) => {
      const noteIds = new Set(manifest.notes.map((note) => note.id));
      const openNotes = state.openNotes.filter((note) =>
        noteIds.has(note.meta.id),
      );
      const activeNote =
        state.activeNote && noteIds.has(state.activeNote.meta.id)
          ? state.activeNote
          : openNotes[openNotes.length - 1] ?? null;

      return {
        activeNote,
        manifest,
        openNotes,
        view: activeNote ? "notes" : state.view,
      };
    });
  },

  renameFolder: async (folder, name) => {
    const nextName = name.trim();
    if (!nextName || nextName === folder.name) return;

    await api.upsertFolder({
      id: folder.id,
      name: nextName,
      parentId: folder.parentId,
    });
    const snapshot = await api.loadWorkspace();
    set({ manifest: snapshot.manifest });
  },

  saveActiveNote: async (content) => {
    const current = get().activeNote;
    if (!current) return;
    set({ saving: true });
    try {
      const note = await api.upsertNote({
        id: current.meta.id,
        title: current.meta.title,
        content,
        folderId: current.meta.folderId,
        parentId: current.meta.parentId,
        tags: current.meta.tags,
        pinned: current.meta.pinned,
      });
      set((state) => ({
        activeNote: note,
        openNotes: state.openNotes.map((item) =>
          item.meta.id === note.meta.id ? note : item,
        ),
        manifest: state.manifest
          ? {
              ...state.manifest,
              updatedAt: note.meta.updatedAt,
              notes: state.manifest.notes.map((item) =>
                item.id === note.meta.id ? note.meta : item,
              ),
            }
          : state.manifest,
        saving: false,
      }));
      persistOpenTabs(get().openNotes, note);
    } catch (error) {
      set({ saving: false });
      toast.error(String(error));
    }
  },

  saveActiveTitle: async (title, content) => {
    const current = get().activeNote;
    if (!current) return;
    const nextTitle = title.trim() || "Untitled";
    const nextContent = content ?? current.content;
    if (nextTitle === current.meta.title && nextContent === current.content) return;

    set({ saving: true });
    try {
      const note = await api.upsertNote({
        id: current.meta.id,
        title: nextTitle,
        content: nextContent,
        folderId: current.meta.folderId,
        parentId: current.meta.parentId,
        tags: current.meta.tags,
        pinned: current.meta.pinned,
      });
      set((state) => ({
        activeNote: note,
        openNotes: state.openNotes.map((item) =>
          item.meta.id === note.meta.id ? note : item,
        ),
        manifest: state.manifest
          ? {
              ...state.manifest,
              updatedAt: note.meta.updatedAt,
              notes: state.manifest.notes.map((item) =>
                item.id === note.meta.id ? note.meta : item,
              ),
            }
          : state.manifest,
        saving: false,
      }));
      persistOpenTabs(get().openNotes, note);
    } catch (error) {
      set({ saving: false });
      toast.error(String(error));
    }
  },

  toggleTodo: async (noteId, line, done) => {
    const current = await api.getNote(noteId);
    if (!current) return;

    const lines = current.content.split("\n");
    const target = lines[line];
    if (!target) return;

    const nextLine = target.replace(
      /^(\s*-\s+\[)( |x|X)(\]\s+.*)$/,
      `$1${done ? "x" : " "}$3`,
    );
    if (nextLine === target) return;

    const content = lines
      .map((item, index) => (index === line ? nextLine : item))
      .join("\n");
    const note = await api.upsertNote({
      id: current.meta.id,
      title: current.meta.title,
      content,
      folderId: current.meta.folderId,
      parentId: current.meta.parentId,
      tags: current.meta.tags,
      pinned: current.meta.pinned,
    });
    const snapshot = await api.loadWorkspace();

    set((state) => ({
      activeNote: state.activeNote?.meta.id === note.meta.id ? note : state.activeNote,
      openNotes: state.openNotes.map((item) =>
        item.meta.id === note.meta.id ? note : item,
      ),
      manifest: snapshot.manifest,
    }));
  },

  deleteTodo: async (noteId, line) => {
    const current = await api.getNote(noteId);
    if (!current) return;

    const lines = current.content.split("\n");
    const target = lines[line];
    if (!target || !/^(\s*-\s+\[)( |x|X)(\]\s+.*)$/.test(target)) return;

    const content = lines.filter((_, index) => index !== line).join("\n");
    const note = await api.upsertNote({
      id: current.meta.id,
      title: current.meta.title,
      content,
      folderId: current.meta.folderId,
      parentId: current.meta.parentId,
      tags: current.meta.tags,
      pinned: current.meta.pinned,
    });
    const snapshot = await api.loadWorkspace();

    set((state) => ({
      activeNote:
        state.activeNote?.meta.id === note.meta.id ? note : state.activeNote,
      openNotes: state.openNotes.map((item) =>
        item.meta.id === note.meta.id ? note : item,
      ),
      manifest: snapshot.manifest,
    }));
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

  deleteSticky: async (id) => {
    const manifest = await api.deleteSticky(id);
    set({ manifest });
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

  deleteBookmark: async (id) => {
    const manifest = await api.deleteBookmark(id);
    set({ manifest });
  },
}));
