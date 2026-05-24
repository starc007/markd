import { invoke } from "@tauri-apps/api/core";
import type {
  BookmarkRecord,
  FolderRecord,
  NoteDocument,
  StickyRecord,
  WorkspaceManifest,
  WorkspaceSnapshot,
} from "@/lib/types";

export function loadWorkspace() {
  return invoke<WorkspaceSnapshot>("load_workspace");
}

export function getNote(id: string) {
  return invoke<NoteDocument | null>("get_note", { id });
}

export function upsertNote(input: {
  id?: string;
  title: string;
  content: string;
  folderId: string | null;
  parentId: string | null;
  tags: string[];
  pinned: boolean;
}) {
  return invoke<NoteDocument>("upsert_note", { input });
}

export function deleteNote(id: string) {
  return invoke<WorkspaceManifest>("delete_note", { id });
}

export function deleteFolder(id: string) {
  return invoke<WorkspaceManifest>("delete_folder", { id });
}

export function upsertFolder(input: {
  id?: string;
  name: string;
  parentId: string | null;
}) {
  return invoke<FolderRecord>("upsert_folder", { input });
}

export function upsertSticky(input: {
  id?: string;
  content: string;
  color: string;
}) {
  return invoke<StickyRecord>("upsert_sticky", { input });
}

export function upsertBookmark(input: {
  id?: string;
  title: string;
  url: string;
  folderId: string | null;
  tags: string[];
}) {
  return invoke<BookmarkRecord>("upsert_bookmark", { input });
}

export function revealWorkspacePath() {
  return invoke<string>("reveal_workspace_path");
}
