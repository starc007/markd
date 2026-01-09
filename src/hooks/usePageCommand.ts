import { useRef, useEffect } from "react";
import type { Editor, Range } from "@tiptap/react";
import * as commands from "../lib/tauri/commands";
import { useNoteStore } from "../stores/noteStore";
import type { NoteMetadata } from "../lib/tauri/commands";

export function usePageCommand(
  noteId: string,
  extractAndSyncPageLinks: (noteId: string, json: any) => Promise<void>
) {
  const noteIdRef = useRef(noteId);
  const syncTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    noteIdRef.current = noteId;
  }, [noteId]);

  const handlePageCommand = (editor: Editor, range: Range) => {
    if (!range) {
      console.error("[usePageCommand] No range provided for page creation");
      return;
    }

    const currentNoteId = noteIdRef.current;
    if (!currentNoteId) {
      console.error("[usePageCommand] No current note to create sub-page");
      return;
    }

    const insertPosition = range.from;

    queueMicrotask(() => {
      if (editor.isDestroyed) {
        console.error("[usePageCommand] Editor is destroyed");
        return;
      }

      commands
        .createSubpage(currentNoteId, "Untitled")
        .then(async (newPage) => {
          if (editor.isDestroyed || !newPage) {
            return;
          }

          const fullNote = await commands.getNote(newPage.id);
          if (!fullNote) {
            console.error("Failed to load created sub-page");
            return;
          }

          // Update store state
          const { childrenMap, notes, expandedPages, loadedChildren } =
            useNoteStore.getState();
          const metadata: NoteMetadata = {
            id: fullNote.id,
            title: fullNote.title,
            preview: null,
            folder_id: fullNote.folder_id,
            parent_id: fullNote.parent_id,
            pinned: false,
            children_count: 0,
            created_at: fullNote.created_at,
            updated_at: fullNote.updated_at,
          };

          const newMap = new Map(childrenMap);
          const parentChildren = newMap.get(currentNoteId) || [];
          newMap.set(currentNoteId, [metadata, ...parentChildren]);

          const updatedNotes = notes.map((n) =>
            n.id === currentNoteId
              ? { ...n, children_count: n.children_count + 1 }
              : n
          );

          for (const [parentIdKey, children] of newMap.entries()) {
            const updatedChildren = children.map((n) =>
              n.id === currentNoteId
                ? { ...n, children_count: n.children_count + 1 }
                : n
            );
            if (updatedChildren.some((n) => n.id === currentNoteId)) {
              newMap.set(parentIdKey, updatedChildren);
            }
          }

          const newExpanded = new Set(expandedPages);
          newExpanded.add(currentNoteId);
          const newLoaded = new Set(loadedChildren);
          newLoaded.add(currentNoteId);

          useNoteStore.setState({
            childrenMap: newMap,
            notes: updatedNotes,
            expandedPages: newExpanded,
            loadedChildren: newLoaded,
          });

          // Insert page link BEFORE navigating (so it's inserted into the current page's editor)
          try {
            const currentState = editor.state;
            if (!currentState?.doc) {
              return;
            }

            const docSize = currentState.doc.content.size;
            const currentFrom = currentState.selection.from;
            const safePosition =
              currentFrom >= 0 && currentFrom <= docSize
                ? currentFrom
                : Math.min(insertPosition, docSize);

            if (safePosition < 0 || safePosition > docSize) {
              return;
            }

            editor
              .chain()
              .focus()
              .insertContentAt(safePosition, [
                {
                  type: "pageLink",
                  attrs: {
                    pageId: newPage.id,
                    pageTitle: newPage.title,
                  },
                },
                { type: "text", text: " " },
              ])
              .run();

            // Save the content with the page link before navigating
            const json = editor.getJSON();
            const jsonString = JSON.stringify(json);

            // Save the parent page's content directly to ensure the link is persisted
            // We do this before navigating so the link is saved to the parent page
            try {
              await commands.saveNoteContent(currentNoteId, jsonString);
              // Sync page links
              await extractAndSyncPageLinks(currentNoteId, json);
            } catch (error) {
              console.error("Failed to save page link to parent:", error);
            }

            // Now navigate to the newly created subpage
            const { loadNote } = useNoteStore.getState();
            await loadNote(fullNote.id);
          } catch (error) {
            console.error("Failed to insert page link:", error);
            // Still navigate even if link insertion fails
            const { loadNote } = useNoteStore.getState();
            await loadNote(fullNote.id);
          }
        })
        .catch((error) => {
          console.error("Failed to create sub-page:", error);
        });
    });
  };

  return { handlePageCommand };
}
