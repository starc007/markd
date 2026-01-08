import { invoke } from "@tauri-apps/api/core";

// Types
export interface Note {
  id: string;
  title: string;
  content: string;
  file_path: string;
  folder_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface NoteMetadata {
  id: string;
  title: string;
  preview: string | null;
  folder_id: string | null;
  pinned: boolean;
  created_at: number;
  updated_at: number;
}

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: number;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  rank: number;
}

export interface StickyNote {
  id: string;
  content: string;
  color_id: string;
  created_at: number;
  updated_at: number;
}

export interface CreateStickyNoteParams {
  content?: string;
  color_id?: string;
}

export interface UpdateStickyNoteParams {
  id: string;
  content?: string;
  color_id?: string;
}

export interface CreateNoteParams {
  title: string;
  content?: string;
  folder_id?: string;
}

export interface UpdateNoteParams {
  id: string;
  title?: string;
  content?: string;
  folder_id?: string;
}

export interface CreateFolderParams {
  name: string;
  parent_id?: string;
}

export interface UpdateFolderParams {
  id: string;
  name?: string;
  parent_id?: string;
}

// Note commands
export async function createNote(params: CreateNoteParams): Promise<Note> {
  return invoke<Note>("create_note", { params });
}

export async function getNote(id: string): Promise<Note | null> {
  return invoke<Note | null>("get_note", { id });
}

export async function updateNote(params: UpdateNoteParams): Promise<Note> {
  return invoke<Note>("update_note", { params });
}

export async function deleteNote(id: string): Promise<void> {
  return invoke<void>("delete_note", { id });
}

export async function listNotes(
  folderId?: string | null,
): Promise<NoteMetadata[]> {
  return invoke<NoteMetadata[]>("list_notes", { folderId });
}

export async function saveNoteContent(
  id: string,
  content: string,
): Promise<number> {
  return invoke<number>("save_note_content", { id, content });
}

// Folder commands
export async function createFolder(
  params: CreateFolderParams,
): Promise<Folder> {
  return invoke<Folder>("create_folder", { params });
}

export async function getFolder(id: string): Promise<Folder | null> {
  return invoke<Folder | null>("get_folder", { id });
}

export async function updateFolder(
  params: UpdateFolderParams,
): Promise<Folder> {
  return invoke<Folder>("update_folder", { params });
}

export async function deleteFolder(id: string): Promise<void> {
  return invoke<void>("delete_folder", { id });
}

export async function listFolders(): Promise<Folder[]> {
  return invoke<Folder[]>("list_folders");
}

export async function moveNoteToFolder(
  noteId: string,
  folderId?: string | null,
): Promise<void> {
  return invoke<void>("move_note_to_folder", { noteId, folderId });
}

// Search commands
export async function searchNotes(query: string): Promise<SearchResult[]> {
  return invoke<SearchResult[]>("search_notes", { query });
}

// Export commands
export async function exportNote(
  noteId: string,
  destination: string,
  markdownContent: string,
): Promise<void> {
  return invoke<void>("export_note", { noteId, destination, markdownContent });
}

export async function getNoteContentForExport(noteId: string): Promise<string> {
  return invoke<string>("get_note_content_for_export", { noteId });
}

export async function importFile(
  filePath: string,
  folderId?: string | null,
): Promise<Note> {
  return invoke<Note>("import_file", { filePath, folderId });
}

export async function toggleNotePinned(
  id: string,
  pinned: boolean,
): Promise<void> {
  return invoke<void>("toggle_note_pinned", { id, pinned });
}

// Sticky Notes commands
export async function createStickyNote(
  params: CreateStickyNoteParams,
): Promise<StickyNote> {
  return invoke<StickyNote>("create_sticky_note", { params });
}

export async function getStickyNote(id: string): Promise<StickyNote | null> {
  return invoke<StickyNote | null>("get_sticky_note", { id });
}

export async function updateStickyNote(
  params: UpdateStickyNoteParams,
): Promise<StickyNote> {
  return invoke<StickyNote>("update_sticky_note", { params });
}

export async function deleteStickyNote(id: string): Promise<void> {
  return invoke<void>("delete_sticky_note", { id });
}

export async function listStickyNotes(): Promise<StickyNote[]> {
  return invoke<StickyNote[]>("list_sticky_notes");
}
