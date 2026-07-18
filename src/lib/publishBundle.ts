import { ipc } from "@/lib/ipc";
import { noteTitle } from "@/lib/utils";
import type { TreeNode } from "@/lib/types";

export interface PublishPageDraft {
  rel: string;
  path: string;
  title: string;
  markdown: string;
}

export interface PublishBundle {
  markdown: string;
  pages: PublishPageDraft[];
}

const MARKDOWN_LINK_RE =
  /(?<!!)\[([^\]]+)\]\(([^)\s]+)(?:\s+("[^"]*"|'[^']*'))?\)/g;
const MAX_PUBLISHED_PAGES = 2_000;

export async function collectPublishBundle(
  rootRel: string,
  rootMarkdown: string,
  tree: TreeNode[],
): Promise<PublishBundle> {
  const noteRels = noteRelMap(tree);
  const contents = new Map<string, string>([[rootRel, rootMarkdown]]);
  const publicPaths = new Map<string, string>([[rootRel, ""]]);
  const queued = [rootRel];
  const usedPaths = new Set<string>();

  for (let index = 0; index < queued.length; index += 1) {
    const rel = queued[index];
    const markdown = contents.get(rel) ?? "";
    for (const href of internalHrefs(markdown)) {
      const target = resolveHref(href, rel, noteRels);
      if (!target || publicPaths.has(target)) continue;
      if (publicPaths.size >= MAX_PUBLISHED_PAGES) break;
      const title = noteTitle(target);
      publicPaths.set(target, uniquePath(slugify(title), usedPaths));
      contents.set(target, await ipc.readNote(target));
      queued.push(target);
    }
  }

  const pages: PublishPageDraft[] = [];
  for (const rel of queued.slice(1)) {
    pages.push({
      rel,
      path: publicPaths.get(rel) ?? slugify(noteTitle(rel)),
      title: noteTitle(rel),
      markdown: rewriteLinks(contents.get(rel) ?? "", rel, noteRels, publicPaths),
    });
  }

  return {
    markdown: rewriteLinks(rootMarkdown, rootRel, noteRels, publicPaths),
    pages,
  };
}

function noteRelMap(tree: TreeNode[]) {
  const rels = new Map<string, string>();
  const walk = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.kind === "note") rels.set(node.rel.toLowerCase(), node.rel);
      if (node.children) walk(node.children);
    }
  };
  walk(tree);
  return rels;
}

function internalHrefs(markdown: string): string[] {
  return Array.from(markdown.matchAll(MARKDOWN_LINK_RE), (match) => match[2]);
}

function resolveHref(
  href: string,
  fromRel: string,
  noteRels: Map<string, string>,
): string | null {
  const trimmed = href.trim();
  if (
    !trimmed ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("markd-page:") ||
    /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
  ) {
    return null;
  }

  let path: string;
  try {
    path = decodeURIComponent(trimmed).split(/[?#]/)[0];
  } catch {
    return null;
  }
  if (!path) return null;
  if (path.startsWith("/")) {
    path = path.replace(/^\/+/, "");
  } else if (path.startsWith(".")) {
    const fromDir = fromRel.split("/").slice(0, -1);
    path = [...fromDir, path].join("/");
  }

  const parts: string[] = [];
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (!parts.length) return null;
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  const rel = parts.join("/");
  if (!rel) return null;
  const withExt = /\.md$/i.test(rel) ? rel : `${rel}.md`;
  return noteRels.get(withExt.toLowerCase()) ?? null;
}

function rewriteLinks(
  markdown: string,
  fromRel: string,
  noteRels: Map<string, string>,
  publicPaths: Map<string, string>,
) {
  return markdown.replace(
    MARKDOWN_LINK_RE,
    (match, label: string, href: string, title?: string) => {
      const target = resolveHref(href, fromRel, noteRels);
      if (!target || !publicPaths.has(target)) return match;
      const path = publicPaths.get(target) ?? "";
      const publicHref = `markd-page:${path}`;
      const suffix = title ? ` ${title}` : "";
      return `[${label}](${publicHref}${suffix})`;
    },
  );
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "page"
  );
}

function uniquePath(base: string, used: Set<string>) {
  let path = base;
  let index = 2;
  while (used.has(path)) {
    path = `${base}-${index}`;
    index += 1;
  }
  used.add(path);
  return path;
}
