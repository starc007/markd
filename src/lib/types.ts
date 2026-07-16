export type Theme = "system" | "light" | "dark";

export type NodeKind = "folder" | "note";

export interface TreeNode {
  name: string;
  /** Path relative to the vault's notes root, e.g. "projects/app.md". */
  rel: string;
  kind: NodeKind;
  children?: TreeNode[];
  modifiedMs: number;
}

export interface VaultSnapshot {
  root: string;
  name: string;
  tree: TreeNode[];
  theme: Theme;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  completedAt: number | null;
  tags: string[];
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  image: string | null;
  favicon: string | null;
  metaFetched: boolean;
  tags: string[];
  createdAt: number;
}

export interface SearchHit {
  rel: string;
  title: string;
  snippet: string;
  titleMatch: boolean;
}

export interface BacklinkMention {
  sourceRel: string;
  context: string;
  line: number;
  occurrence: number;
}

export interface PublishedShare {
  id: string;
  entryId: string;
  slug: string;
  url: string;
  title: string;
  contentHash: string;
  publishedAt: number;
  updatedAt: number;
}

export interface CloudAccount {
  email: string;
  plan: "free" | "cloud";
}

export interface CloudAccountStatus {
  account: CloudAccount | null;
  loginUrl: string;
}

export interface PublishedNoteStatus {
  account: CloudAccount | null;
  share: PublishedShare | null;
  isOutdated: boolean;
  freeShareLimit: number;
}

export type View =
  | { type: "note"; rel: string }
  | { type: "todos" }
  | { type: "bookmarks" };
