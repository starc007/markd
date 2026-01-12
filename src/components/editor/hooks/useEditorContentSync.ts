import { useRef, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import * as commands from "../../../lib/tauri/commands";
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
    []
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
    [extractAndSyncPageLinks, isSwitchingNotesRef, isMountedRef]
  );

  // Update content when noteId or content changes
  useEffect(() => {
    if (!editor) return;

    const noteIdChanged = noteIdRef.current !== noteId;
    const contentChanged = lastContentRef.current !== content;

    if (noteIdChanged || contentChanged) {
      // Set flag to prevent saves during note switch or content update
      if (noteIdChanged) {
        // CRITICAL: Before switching notes, save any pending content from the previous note
        // This ensures no content is lost when switching notes
        if (saveTimeoutRef.current && editor) {
          // Cancel the timeout
          window.clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;

          // Get the noteId that the pending save was for
          const previousNoteId = pendingSaveNoteIdRef.current;
          pendingSaveNoteIdRef.current = null;

          // If we have a pending save and we're still on that note, save immediately
          if (previousNoteId && previousNoteId === noteIdRef.current) {
            const json = editor.getJSON();
            const jsonString = JSON.stringify(json);

            // Only save if content actually changed
            if (jsonString !== lastSavedContentRef.current) {
              lastSavedContentRef.current = jsonString;
              // Save immediately for the previous note
              onContentChangeRef.current(jsonString);
              // Extract page links from content and sync
              extractAndSyncPageLinks(previousNoteId, json);
            }
          }
        }

        isSwitchingNotesRef.current = true;
        noteIdRef.current = noteId;
      } else if (contentChanged) {
        // Also set flag for content changes to prevent saves when content is updated programmatically
        isSwitchingNotesRef.current = true;
      }

      // Clear any pending saves (for content changes)
      if (saveTimeoutRef.current && !noteIdChanged) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        pendingSaveNoteIdRef.current = null;
      }

      const json = parseContent(content);
      const contentString = JSON.stringify(json);

      // Only update if content actually changed (avoid unnecessary updates)
      const currentEditorContent = JSON.stringify(editor.getJSON());
      if (contentString !== currentEditorContent) {
        // Use emitUpdate: false to prevent onUpdate event
        editor.commands.setContent(json, {
          emitUpdate: false,
        });

        // Reset last saved content to match what we just set
        lastSavedContentRef.current = contentString;
      } else {
        // Even if content didn't change, update lastSavedContentRef to match
        lastSavedContentRef.current = contentString;
      }

      // Always update the ref to track the latest content
      lastContentRef.current = content;

      // Reset flag after a delay to allow any pending updates to complete
      if (switchingTimeoutRef.current) {
        window.clearTimeout(switchingTimeoutRef.current);
      }

      // Use a longer delay to ensure all TipTap internal updates complete
      switchingTimeoutRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          isSwitchingNotesRef.current = false;
        }
        switchingTimeoutRef.current = null;
      }, 200);
    }
  }, [noteId, editor, content, isSwitchingNotesRef, isMountedRef]);

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
