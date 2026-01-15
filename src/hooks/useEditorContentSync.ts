import { useRef, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import * as commands from "@/lib/tauri/commands";
import { parseContent } from "./useEditorConfig";

interface UseEditorContentSyncOptions {
  noteId: string;
  content: string;
  onContentChange: (content: string) => void;
  editor: Editor | null;
  isSwitchingNotesRef: React.MutableRefObject<boolean>;
  isMountedRef: React.MutableRefObject<boolean>;
}

/**
 * Hook to handle content syncing, saving, and page link extraction
 */
export function useEditorContentSync({
  noteId,
  content,
  onContentChange,
  editor,
  isSwitchingNotesRef,
  isMountedRef,
}: UseEditorContentSyncOptions) {
  const noteIdForLinksRef = useRef<string>(noteId);
  const saveTimeoutRef = useRef<number | null>(null);
  const switchingTimeoutRef = useRef<number | null>(null);
  const noteIdRef = useRef<string | null>(noteId);
  const onContentChangeRef = useRef(onContentChange);
  const lastSavedContentRef = useRef<string>("");
  const lastContentRef = useRef<string>(content);
  // Store the noteId when a save is scheduled to prevent saving to wrong note
  const pendingSaveNoteIdRef = useRef<string | null>(null);
  // Store cursor positions per note
  const cursorPositionsRef = useRef<Map<string, { from: number; to: number }>>(
    new Map(),
  );
  // Track if user has made any edits to the current note (to prevent content updates from props)
  const hasUserEditedRef = useRef<boolean>(false);

  // Update noteId ref when it changes
  useEffect(() => {
    noteIdForLinksRef.current = noteId;
  }, [noteId]);

  // Keep callback ref updated
  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  // Extract page links from TipTap JSON and sync with backend
  const extractAndSyncPageLinks = useCallback(
    async (currentNoteId: string, json: any) => {
      const pageIds = new Set<string>();

      // Recursively find all pageLink nodes
      const findPageLinks = (node: any) => {
        if (node.type === "pageLink" && node.attrs?.pageId) {
          pageIds.add(node.attrs.pageId);
        }
        if (node.content && Array.isArray(node.content)) {
          node.content.forEach(findPageLinks);
        }
      };

      findPageLinks(json);

      // Sync page links (debounced - only sync after save)
      if (pageIds.size > 0) {
        try {
          await commands.syncPageLinks(currentNoteId, Array.from(pageIds));
        } catch (error) {
          console.error("Failed to sync page links:", error);
        }
      }
    },
    [],
  );

  // Handle content updates with debouncing
  const handleContentUpdate = useCallback(
    (editor: Editor, transaction: any) => {
      // Ignore if we're switching notes or updating content programmatically
      if (isSwitchingNotesRef.current) {
        return;
      }

      // Ignore if this is not a user-initiated change
      if (!transaction.docChanged) {
        return;
      }

      // Mark that user has edited this note
      hasUserEditedRef.current = true;

      // Store cursor position for current note
      const { from, to } = editor.state.selection;
      cursorPositionsRef.current.set(noteIdForLinksRef.current, { from, to });

      // Double-check: compare with last saved content to prevent unnecessary saves
      const json = editor.getJSON();
      const jsonString = JSON.stringify(json);
      if (jsonString === lastSavedContentRef.current) {
        return; // Content hasn't actually changed, don't save
      }

      // Clear previous timeout
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }

      // Store the noteId when scheduling the save
      const saveNoteId = noteIdForLinksRef.current;
      pendingSaveNoteIdRef.current = saveNoteId;

      // Debounce saves - save after 150ms of no changes
      saveTimeoutRef.current = window.setTimeout(() => {
        // Prevent execution if component has unmounted
        if (!isMountedRef.current) {
          pendingSaveNoteIdRef.current = null;
          return;
        }

        // Critical: Only save if we're still on the same note
        // This prevents saving content from one note to another when switching quickly
        if (noteIdForLinksRef.current !== saveNoteId) {
          // Note has changed, don't save
          pendingSaveNoteIdRef.current = null;
          return;
        }

        if (
          editor &&
          onContentChangeRef.current &&
          !isSwitchingNotesRef.current
        ) {
          const json = editor.getJSON();
          const jsonString = JSON.stringify(json);

          // Only save if content actually changed
          if (jsonString !== lastSavedContentRef.current) {
            lastSavedContentRef.current = jsonString;
            onContentChangeRef.current(jsonString);

            // Extract page links from content and sync
            extractAndSyncPageLinks(saveNoteId, json);
          }
        }
        pendingSaveNoteIdRef.current = null;
      }, 150);
    },
    [extractAndSyncPageLinks, isSwitchingNotesRef, isMountedRef],
  );

  // Update content when noteId or content changes
  useEffect(() => {
    if (!editor) return;

    const noteIdChanged = noteIdRef.current !== noteId;
    const contentChanged = lastContentRef.current !== content;

    if (noteIdChanged) {
      // CRITICAL: Before switching notes, save any pending content from the previous note
      // This ensures no content is lost when switching notes
      if (saveTimeoutRef.current && editor) {
        // Cancel the timeout
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;

        pendingSaveNoteIdRef.current = null;
      }

      // Store cursor position for the previous note before switching
      if (noteIdRef.current) {
        const { from, to } = editor.state.selection;
        cursorPositionsRef.current.set(noteIdRef.current, { from, to });
      }

      isSwitchingNotesRef.current = true;
      noteIdRef.current = noteId;
      hasUserEditedRef.current = false; // Reset for new note

      // Update content for the new note
      const json = parseContent(content);
      const contentString = JSON.stringify(json);

      // Use emitUpdate: false to prevent onUpdate event
      editor.commands.setContent(json, {
        emitUpdate: false,
      });

      // Reset last saved content to match what we just set
      lastSavedContentRef.current = contentString;
      lastContentRef.current = content;

      // Restore cursor position for this note if we have one stored
      const savedCursor = cursorPositionsRef.current.get(noteId);
      if (savedCursor) {
        // Use setTimeout to ensure content is fully set before restoring selection
        setTimeout(() => {
          if (editor && isMountedRef.current && noteIdRef.current === noteId) {
            try {
              const docSize = editor.state.doc.content.size;
              // Only restore if the saved position is still within document bounds
              if (savedCursor.from <= docSize && savedCursor.to <= docSize) {
                editor.commands.setTextSelection({
                  from: Math.min(savedCursor.from, docSize),
                  to: Math.min(savedCursor.to, docSize),
                });
              }
            } catch (e) {
              // If restoring selection fails, silently continue
            }
          }
        }, 50);
      }

      // Reset flag after a delay to allow all TipTap internal updates to complete
      if (switchingTimeoutRef.current) {
        window.clearTimeout(switchingTimeoutRef.current);
      }

      switchingTimeoutRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          isSwitchingNotesRef.current = false;
        }
        switchingTimeoutRef.current = null;
      }, 200);
    } else if (contentChanged) {
      // Content changed for the same note - this should only happen from external sources
      // If user has edited, don't update from props (user's edits take precedence)
      if (hasUserEditedRef.current) {
        // User has edited this note - don't update content from props
        // Just update the ref to track the latest content
        lastContentRef.current = content;
        return;
      }

      // Only update if content actually changed (avoid unnecessary updates)
      const json = parseContent(content);
      const contentString = JSON.stringify(json);
      const currentEditorContent = JSON.stringify(editor.getJSON());

      if (contentString !== currentEditorContent) {
        // Store current cursor position before updating
        const { from, to } = editor.state.selection;
        cursorPositionsRef.current.set(noteId, { from, to });

        // Use emitUpdate: false to prevent onUpdate event
        editor.commands.setContent(json, {
          emitUpdate: false,
        });

        // Try to restore cursor position
        setTimeout(() => {
          if (editor && isMountedRef.current && noteIdRef.current === noteId) {
            try {
              const docSize = editor.state.doc.content.size;
              if (from <= docSize && to <= docSize) {
                editor.commands.setTextSelection({
                  from: Math.min(from, docSize),
                  to: Math.min(to, docSize),
                });
              }
            } catch (e) {
              // If restoring selection fails, silently continue
            }
          }
        }, 0);

        // Reset last saved content to match what we just set
        lastSavedContentRef.current = contentString;
      } else {
        // Even if content didn't change, update lastSavedContentRef to match
        lastSavedContentRef.current = contentString;
      }

      // Always update the ref to track the latest content
      lastContentRef.current = content;
    }
  }, [
    noteId,
    editor,
    content,
    isSwitchingNotesRef,
    isMountedRef,
    extractAndSyncPageLinks,
  ]);

  // Save on window blur
  useEffect(() => {
    if (!editor) return;

    const handleWindowBlur = () => {
      // Don't save if component unmounted or switching notes
      if (!isMountedRef.current || isSwitchingNotesRef.current) {
        return;
      }

      // Store current noteId to ensure we're saving to the correct note
      const currentNoteId = noteIdForLinksRef.current;

      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        pendingSaveNoteIdRef.current = null;
      }

      const json = editor.getJSON();
      const jsonString = JSON.stringify(json);

      // Only save if content actually changed and we're still on the same note
      if (
        jsonString !== lastSavedContentRef.current &&
        noteIdForLinksRef.current === currentNoteId
      ) {
        lastSavedContentRef.current = jsonString;
        onContentChangeRef.current(jsonString);
      }
    };

    window.addEventListener("blur", handleWindowBlur);
    return () => window.removeEventListener("blur", handleWindowBlur);
  }, [editor, isSwitchingNotesRef, isMountedRef]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      // Mark component as unmounted FIRST to prevent any pending callbacks from executing
      isMountedRef.current = false;

      // Clear all pending timeouts
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        pendingSaveNoteIdRef.current = null;
      }
      if (switchingTimeoutRef.current) {
        window.clearTimeout(switchingTimeoutRef.current);
        switchingTimeoutRef.current = null;
      }

      // Don't save on unmount if we're switching notes
      if (editor && !isSwitchingNotesRef.current) {
        const json = editor.getJSON();
        const jsonString = JSON.stringify(json);

        // Only save if content actually changed
        if (jsonString !== lastSavedContentRef.current) {
          lastSavedContentRef.current = jsonString;
          onContentChangeRef.current(jsonString);
        }
      }
    };
  }, [editor, isSwitchingNotesRef]);

  return {
    handleContentUpdate,
    extractAndSyncPageLinks,
  };
}
