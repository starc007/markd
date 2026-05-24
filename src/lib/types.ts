export type ViewMode = "notes" | "todos" | "stickies" | "bookmarks" | "settings";

export interface WorkspaceManifest {
  version: number;
  workspaceId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  folders: FolderRecord[];
  notes: NoteRecord[];
  stickies: StickyRecord[];
  bookmarks: BookmarkRecord[];
}

export interface FolderRecord {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface NoteRecord {
  id: string;
  title: string;
  path: string;
  folderId: string | null;
  parentId: string | null;
  tags: string[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface NoteDocument {
  meta: NoteRecord;
  content: string;
}

export interface StickyRecord {
  id: string;
  content: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface BookmarkRecord {
  id: string;
  title: string;
  url: string;
  folderId: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceSnapshot {
  rootPath: string;
  manifest: WorkspaceManifest;
  activeNote: NoteDocument | null;
}
