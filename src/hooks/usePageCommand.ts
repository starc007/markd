import { useRef, useEffect } from "react";
import type { Editor, Range } from "@tiptap/react";
import * as commands from "../lib/tauri/commands";
import { useNoteStore } from "../stores/noteStore";

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

      // Use store's createSubpage method which handles all state updates properly
      // Skip opening the tab so we can insert the link first
      const { createSubpage } = useNoteStore.getState();
      createSubpage(currentNoteId, "Untitled", { skipOpenTab: true })
        .then(async (fullNote) => {
          if (editor.isDestroyed || !fullNote) {
            return;
          }

          // Insert page link into the current page's editor BEFORE navigating
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
                    pageId: fullNote.id,
                    pageTitle: fullNote.title,
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
