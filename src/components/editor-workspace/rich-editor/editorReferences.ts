import type { NoteRecord } from "@/lib/types";

export function getPageLinks(content: string, notes: NoteRecord[]) {
  const titles = new Set<string>();
  const wikiLinks = content.matchAll(/\[\[([^\]]+)\]\]/g);
  const markdownLinks = content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);

  for (const match of wikiLinks) {
    const title = match[1]?.trim();
    if (title) titles.add(title);
  }

  for (const match of markdownLinks) {
    const title = match[1]?.trim();
    const href = match[2]?.trim();
    if (title && href?.startsWith("draft://note/")) titles.add(title);
  }

  return notes.filter((note) => titles.has(note.title));
}

export function getBacklinks(
  activeTitle: string,
  activeId: string,
  notes: NoteRecord[],
) {
  const normalizedTitle = activeTitle.toLowerCase();
  return notes.filter((note) => {
    if (note.id === activeId) return false;
    return note.title.toLowerCase().includes(normalizedTitle);
  });
}

