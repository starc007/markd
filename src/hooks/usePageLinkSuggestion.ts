import { useMemo, useEffect, useState, useRef } from "react";
import { useNoteStore } from "../stores/noteStore";
import * as commands from "../lib/tauri/commands";

export interface PageLinkSuggestionItem {
  pageId: string;
  pageTitle: string;
}

export function usePageLinkSuggestion(currentNoteId?: string | null) {
  const { notes, childrenMap } = useNoteStore();
  const [allNotes, setAllNotes] = useState<Array<{ id: string; title: string }>>([]);
  const allPagesRef = useRef<Array<{ id: string; title: string }>>([]);

  // Get immediate notes from store (synchronous fallback)
  const immediateNotes = useMemo(() => {
    const all: Array<{ id: string; title: string }> = [];
    
    // Add top-level notes
    for (const note of notes) {
      all.push({ id: note.id, title: note.title || "Untitled" });
    }
    
    // Add children from childrenMap
    for (const children of childrenMap.values()) {
      for (const child of children) {
        all.push({ id: child.id, title: child.title || "Untitled" });
      }
    }
    
    return all;
  }, [notes, childrenMap]);

  // Load all notes including nested ones in the background
  useEffect(() => {
    const loadAllNotes = async () => {
      const all: Array<{ id: string; title: string }> = [];
      const loaded = new Set<string>(); // Track loaded notes to avoid duplicates
      const toLoad: string[] = []; // Queue of note IDs to load children for

      // Start with root-level notes
      for (const note of notes) {
        if (!loaded.has(note.id)) {
          all.push({ id: note.id, title: note.title || "Untitled" });
          loaded.add(note.id);
          // Always add to queue to check for children (even if children_count is 0, it might be outdated)
          toLoad.push(note.id);
        }
      }

      // Also add notes from childrenMap that are already loaded
      for (const children of childrenMap.values()) {
        for (const child of children) {
          if (!loaded.has(child.id)) {
            all.push({ id: child.id, title: child.title || "Untitled" });
            loaded.add(child.id);
            // Always add to queue to check for children
            toLoad.push(child.id);
          }
        }
      }

      // Recursively load children for all notes
      const childrenLoaded = new Set<string>(); // Track which parents we've loaded children for
      while (toLoad.length > 0) {
        const parentId = toLoad.shift()!;
        // Skip if we've already loaded children for this parent
        if (childrenLoaded.has(parentId)) {
          continue;
        }
        childrenLoaded.add(parentId);
        
        try {
          const children = await commands.getPageChildren(parentId);
          // Even if children_count was 0, we should check for children
          for (const child of children) {
            if (!loaded.has(child.id)) {
              all.push({ id: child.id, title: child.title || "Untitled" });
              loaded.add(child.id);
              // Always add to queue to check for nested children
              toLoad.push(child.id);
            }
          }
        } catch (error) {
          // If getPageChildren fails, it might mean the note has no children
          // This is fine, just continue
          console.debug(`[usePageLinkSuggestion] No children for ${parentId} or error:`, error);
        }
      }

      setAllNotes(all);
    };

    // Only load if we have notes
    if (notes.length > 0 || childrenMap.size > 0) {
      loadAllNotes();
    } else {
      // Reset if no notes
      setAllNotes([]);
    }
  }, [notes, childrenMap]);

  // Use loaded notes if available, otherwise fall back to immediate notes
  // Always merge both to ensure we have all notes
  const allPages = useMemo(() => {
    const merged = new Map<string, { id: string; title: string }>();
    
    // Add immediate notes first
    for (const note of immediateNotes) {
      merged.set(note.id, note);
    }
    
    // Add loaded notes (will overwrite duplicates)
    for (const note of allNotes) {
      merged.set(note.id, note);
    }
    
    const result = Array.from(merged.values()).filter((page) => page.id !== currentNoteId);
    // Update ref with latest value
    allPagesRef.current = result;
    return result;
  }, [allNotes, immediateNotes, currentNoteId]);

  const getPageSuggestions = useMemo(() => {
    return (query: string): PageLinkSuggestionItem[] => {
      // Always use the latest allPages from ref to avoid stale closures
      const allPagesToUse = allPagesRef.current;
      const lowerQuery = query.toLowerCase().trim();

      let result: PageLinkSuggestionItem[];
      if (!lowerQuery) {
        result = allPagesToUse.slice(0, 10).map((page) => ({
          pageId: page.id,
          pageTitle: page.title || "Untitled",
        }));
      } else {
        result = allPagesToUse
          .filter((page) => {
            const title = (page.title || "Untitled").toLowerCase();
            return title.includes(lowerQuery);
          })
          .slice(0, 10)
          .map((page) => ({
            pageId: page.id,
            pageTitle: page.title || "Untitled",
          }));
      }

      return result;
    };
  }, []); // Empty deps - function reads from ref which always has latest value

  return { getPageSuggestions, allPages };
}
