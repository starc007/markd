import { create } from "zustand";
import { toast } from "sonner";
import { ipc } from "@/lib/ipc";
import type { Theme, TreeNode, View } from "@/lib/types";
import { parentDir } from "@/lib/utils";

type Status = "loading" | "welcome" | "ready";

interface VaultState {
  status: Status;
  root: string;
  name: string;
  tree: TreeNode[];
  theme: Theme;
  view: View | null;
  expanded: Set<string>;

  startup: () => Promise<void>;
  chooseVault: () => Promise<void>;
  refreshTree: () => Promise<void>;
  setView: (view: View | null) => void;
  toggleExpanded: (rel: string) => void;
  expandTo: (rel: string) => void;

  createNote: (dir: string) => Promise<void>;
  createFolder: (dir: string, name: string) => Promise<string | null>;
  renameEntry: (rel: string, name: string) => Promise<void>;
  moveEntry: (rel: string, dir: string) => Promise<void>;
  deleteEntry: (rel: string) => Promise<void>;

  setTheme: (theme: Theme) => Promise<void>;
}

function applyTheme(theme: Theme) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const dark = theme === "dark" || (theme === "system" && media.matches);
  document.documentElement.classList.toggle("dark", dark);
}

let systemThemeListener: (() => void) | null = null;

function watchSystemTheme(get: () => VaultState) {
  if (systemThemeListener) return;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  systemThemeListener = () => applyTheme(get().theme);
  media.addEventListener("change", systemThemeListener);
}

const oops = (err: unknown) =>
  toast.error(err instanceof Error ? err.message : String(err));

export const useVault = create<VaultState>((set, get) => ({
  status: "loading",
  root: "",
  name: "",
  tree: [],
  theme: "system",
  view: null,
  expanded: new Set<string>(),

  startup: async () => {
    watchSystemTheme(get);
    try {
      const snapshot = await ipc.startup();
      if (!snapshot) {
        applyTheme("system");
        set({ status: "welcome" });
        return;
      }
      applyTheme(snapshot.theme);
      set({
        status: "ready",
        root: snapshot.root,
        name: snapshot.name,
        tree: snapshot.tree,
        theme: snapshot.theme,
      });
    } catch (err) {
      oops(err);
      set({ status: "welcome" });
    }
  },

  chooseVault: async () => {
    try {
      const snapshot = await ipc.chooseVault();
      if (!snapshot) return;
      applyTheme(snapshot.theme);
      set({
        status: "ready",
        root: snapshot.root,
        name: snapshot.name,
        tree: snapshot.tree,
        theme: snapshot.theme,
        view: null,
        expanded: new Set<string>(),
      });
    } catch (err) {
      oops(err);
    }
  },

  refreshTree: async () => {
    if (get().status !== "ready") return;
    try {
      set({ tree: await ipc.loadTree() });
    } catch {
      // transient (e.g. vault briefly unavailable) — next refresh wins
    }
  },

  setView: (view) => set({ view }),

  toggleExpanded: (rel) => {
    const expanded = new Set(get().expanded);
    if (expanded.has(rel)) {
      expanded.delete(rel);
    } else {
      expanded.add(rel);
    }
    set({ expanded });
  },

  expandTo: (rel) => {
    const expanded = new Set(get().expanded);
    const parts = rel.split("/");
    let path = "";
    for (const part of parts.slice(0, -1)) {
      path = path ? `${path}/${part}` : part;
      expanded.add(path);
    }
    set({ expanded });
  },

  createNote: async (dir) => {
    try {
      const rel = await ipc.createNote(dir, "Untitled");
      await get().refreshTree();
      get().expandTo(rel);
      set({ view: { type: "note", rel } });
    } catch (err) {
      oops(err);
    }
  },

  createFolder: async (dir, name) => {
    try {
      const rel = await ipc.createFolder(dir, name);
      await get().refreshTree();
      get().expandTo(`${rel}/x`);
      return rel;
    } catch (err) {
      oops(err);
      return null;
    }
  },

  renameEntry: async (rel, name) => {
    try {
      const next = await ipc.renameEntry(rel, name);
      const { view } = get();
      await get().refreshTree();
      if (view?.type === "note") {
        if (view.rel === rel) {
          set({ view: { type: "note", rel: next } });
        } else if (view.rel.startsWith(`${rel}/`)) {
          set({ view: { type: "note", rel: view.rel.replace(rel, next) } });
        }
      }
    } catch (err) {
      oops(err);
    }
  },

  moveEntry: async (rel, dir) => {
    try {
      const next = await ipc.moveEntry(rel, dir);
      const { view } = get();
      await get().refreshTree();
      get().expandTo(next);
      if (view?.type === "note") {
        if (view.rel === rel) {
          set({ view: { type: "note", rel: next } });
        } else if (view.rel.startsWith(`${rel}/`)) {
          set({ view: { type: "note", rel: view.rel.replace(rel, next) } });
        }
      }
    } catch (err) {
      oops(err);
    }
  },

  deleteEntry: async (rel) => {
    try {
      await ipc.deleteEntry(rel);
      const { view } = get();
      await get().refreshTree();
      if (
        view?.type === "note" &&
        (view.rel === rel || view.rel.startsWith(`${rel}/`))
      ) {
        set({ view: null });
      }
      toast("Moved to Trash", {
        description: rel.split("/").pop()?.replace(/\.md$/, ""),
      });
    } catch (err) {
      oops(err);
    }
  },

  setTheme: async (theme) => {
    applyTheme(theme);
    set({ theme });
    try {
      await ipc.setTheme(theme);
    } catch (err) {
      oops(err);
    }
  },
}));

/** Folder rel of the current selection — used as target for "new note". */
export function activeDir(state: Pick<VaultState, "view">) {
  return state.view?.type === "note" ? parentDir(state.view.rel) : "";
}
