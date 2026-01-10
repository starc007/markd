import { useMemo } from "react";
import { useNoteStore } from "../stores/noteStore";

export interface PageLinkSuggestionItem {
  pageId: string;
  pageTitle: string;
}

export function usePageLinkSuggestion(currentNoteId?: string | null) {
  const { notes, childrenMap } = useNoteStore();

  // Get all pages (top-level + children) for suggestions, excluding current page
  const allPages = useMemo(() => {
    const all: Array<{ id: string; title: string }> = [];

    // Add top-level notes (excluding current page)
    for (const note of notes) {
      if (note.id !== currentNoteId) {
        all.push({ id: note.id, title: note.title || "Untitled" });
      }
    }

    // Add children from all expanded pages (excluding current page)
    for (const children of childrenMap.values()) {
      for (const child of children) {
        if (child.id !== currentNoteId) {
          all.push({ id: child.id, title: child.title || "Untitled" });
        }
      }
    }

    return all;
  }, [notes, childrenMap, currentNoteId]);

  const getPageSuggestions = (query: string): PageLinkSuggestionItem[] => {
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      return allPages.slice(0, 10).map((page) => ({
        pageId: page.id,
        pageTitle: page.title,
      }));
    }

    return allPages
      .filter((page) => page.title.toLowerCase().includes(lowerQuery))
      .slice(0, 10)
      .map((page) => ({
        pageId: page.id,
        pageTitle: page.title,
      }));
  };

  return { getPageSuggestions, allPages };
}
