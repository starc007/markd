import { invoke } from "@tauri-apps/api/core";
import type {
  Bookmark,
  SearchHit,
  Theme,
  Todo,
  TreeNode,
  VaultSnapshot,
} from "./types";

interface ErrorPayload {
  kind: string;
  message: string;
}

export class IpcError extends Error {
  kind: string;

  constructor(payload: ErrorPayload) {
    super(payload.message);
    this.kind = payload.kind;
  }
}

async function call<T>(command: string, args?: Record<string, unknown>) {
  try {
    return await invoke<T>(command, args);
  } catch (raw) {
    if (raw && typeof raw === "object" && "message" in raw) {
      throw new IpcError(raw as ErrorPayload);
    }
    throw new IpcError({ kind: "other", message: String(raw) });
  }
}

export const ipc = {
  startup: () => call<VaultSnapshot | null>("startup"),
  chooseVault: () => call<VaultSnapshot | null>("choose_vault"),
  loadTree: () => call<TreeNode[]>("load_tree"),

  readNote: (rel: string) => call<string>("read_note", { rel }),
  writeNote: (rel: string, content: string) =>
    call<void>("write_note", { rel, content }),
  createNote: (dir: string, title: string) =>
    call<string>("create_note", { dir, title }),
  createFolder: (dir: string, name: string) =>
    call<string>("create_folder", { dir, name }),
  renameEntry: (rel: string, name: string) =>
    call<string>("rename_entry", { rel, name }),
  moveEntry: (rel: string, dir: string) =>
    call<string>("move_entry", { rel, dir }),
  deleteEntry: (rel: string) => call<void>("delete_entry", { rel }),
  searchNotes: (query: string, limit?: number) =>
    call<SearchHit[]>("search_notes", { query, limit }),

  todosList: () => call<Todo[]>("todos_list"),
  todoAdd: (text: string) => call<Todo>("todo_add", { text }),
  todoToggle: (id: string) => call<Todo>("todo_toggle", { id }),
  todoUpdate: (id: string, text: string) =>
    call<Todo>("todo_update", { id, text }),
  todoSetTags: (id: string, tags: string[]) =>
    call<Todo>("todo_set_tags", { id, tags }),
  todoDelete: (id: string) => call<void>("todo_delete", { id }),
  todosClearCompleted: () => call<Todo[]>("todos_clear_completed"),

  bookmarksList: () => call<Bookmark[]>("bookmarks_list"),
  bookmarkAdd: (url: string) => call<Bookmark>("bookmark_add", { url }),
  bookmarkUpdateTitle: (id: string, title: string) =>
    call<Bookmark>("bookmark_update_title", { id, title }),
  bookmarkSetTags: (id: string, tags: string[]) =>
    call<Bookmark>("bookmark_set_tags", { id, tags }),
  bookmarkDelete: (id: string) => call<void>("bookmark_delete", { id }),
  bookmarkFetchMeta: (id: string) => call<Bookmark>("bookmark_fetch_meta", { id }),

  saveImageAsset: (data: string, extension: string) =>
    call<string>("save_image_asset", { data, extension }),
  setTheme: (theme: Theme) => call<void>("set_theme", { theme }),
};
