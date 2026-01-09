import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { useEditor, EditorContent as TiptapEditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { UiState } from "../../lib/tiptap-extension/ui-state-extension";
import { NodeAlignment } from "../../lib/tiptap-extension/node-alignment-extension";
import { NodeBackground } from "../../lib/tiptap-extension/node-background-extension";
import { ListNormalizationExtension } from "../../lib/tiptap-extension/list-normalization-extension";
import { PageLinkExtension } from "../../lib/tiptap-extension/page-link-extension";
import { SlashDropdownMenu } from "./slash-dropdown-menu";
import { FloatingToolbar } from "./floating-toolbar";
import { PageLinkMenu } from "./PageLinkMenu";
import { useNoteStore } from "../../stores/noteStore";
import * as commands from "../../lib/tauri/commands";

interface EditorContentProps {
  content: string;
  noteId: string;
  onContentChange: (content: string) => void;
}

export interface EditorContentRef {
  focus: () => void;
  getEditor: () => ReturnType<typeof useEditor> | null;
}

export const EditorContent = forwardRef<EditorContentRef, EditorContentProps>(
  ({ content, noteId, onContentChange }, ref) => {
    const noteIdForLinksRef = useRef<string>(noteId);

    // Update noteId ref when it changes
    useEffect(() => {
      noteIdForLinksRef.current = noteId;
    }, [noteId]);
    const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);
    const saveTimeoutRef = useRef<number | null>(null);
    const noteIdRef = useRef<string | null>(null);
    const onContentChangeRef = useRef(onContentChange);
    const lastSavedContentRef = useRef<string>("");
    const isSwitchingNotesRef = useRef<boolean>(false);
    const { loadNote } = useNoteStore();

    // Extract page links from TipTap JSON and sync with backend
    const extractAndSyncPageLinks = async (
      currentNoteId: string,
      json: any
    ) => {
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
    };

    // Keep callback ref updated
    useEffect(() => {
      onContentChangeRef.current = onContentChange;
    }, [onContentChange]);

    // Parse content safely
    const parseContent = (content: string) => {
      if (!content || content.trim() === "") {
        return { type: "doc", content: [{ type: "paragraph" }] };
      }
      try {
        return JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse note content:", e);
        return { type: "doc", content: [{ type: "paragraph" }] };
      }
    };

    // Initialize editor
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Highlight,
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline",
          },
        }),
        Placeholder.configure({
          placeholder: "Type '/' for commands...",
        }),
        UiState,
        NodeAlignment,
        NodeBackground,
        ListNormalizationExtension,
        PageLinkExtension.configure({
          HTMLAttributes: {
            class: "page-link",
          },
        }),
      ],
      content: parseContent(content),
      editorProps: {
        attributes: {
          class: "tiptap-editor focus:outline-none",
        },
      },
      onUpdate: ({ editor, transaction }) => {
        // Ignore if we're switching notes
        if (isSwitchingNotesRef.current) {
          return;
        }

        // Ignore if this is not a user-initiated change
        if (!transaction.docChanged) {
          return;
        }

        // Clear previous timeout
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
        }

        // Debounce saves - save after 500ms of no changes
        saveTimeoutRef.current = window.setTimeout(() => {
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
              extractAndSyncPageLinks(noteIdForLinksRef.current, json);
            }
          }
        }, 500);
      },
      onCreate: ({ editor }) => {
        editorRef.current = editor;
        // Initialize lastSavedContentRef with current content
        const json = editor.getJSON();
        lastSavedContentRef.current = JSON.stringify(json);
      },
      onDestroy: () => {
        editorRef.current = null;
      },
    });

    // Update content when noteId changes (only when noteId actually changes, not when content updates)
    useEffect(() => {
      if (noteIdRef.current !== noteId && editor) {
        // Set flag to prevent saves during note switch
        isSwitchingNotesRef.current = true;

        noteIdRef.current = noteId;

        // Clear any pending saves
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }

        const json = parseContent(content);

        // Use emitUpdate: false to prevent onUpdate event
        editor.commands.setContent(json, {
          emitUpdate: false,
        });

        // Reset last saved content when switching notes (use the content prop as-is since it's already JSON string)
        lastSavedContentRef.current = content || JSON.stringify(json);

        // Reset flag after a short delay to allow any pending updates to complete
        setTimeout(() => {
          isSwitchingNotesRef.current = false;
        }, 100);
      }
    }, [noteId, editor]); // Removed content from dependencies to prevent re-triggering on content updates

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      focus: () => {
        if (editor) {
          editor.commands.focus();
          // Move cursor to end of content
          const { from, to } = editor.state.selection;
          const docSize = editor.state.doc.content.size;
          if (from === to && from < docSize) {
            editor.commands.setTextSelection(docSize);
          }
        }
      },
      getEditor: () => editor,
    }));

    // Save on window blur
    useEffect(() => {
      const handleWindowBlur = () => {
        // Don't save if we're switching notes
        if (isSwitchingNotesRef.current) {
          return;
        }

        if (editor && saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        if (editor) {
          const json = editor.getJSON();
          const jsonString = JSON.stringify(json);

          // Only save if content actually changed
          if (jsonString !== lastSavedContentRef.current) {
            lastSavedContentRef.current = jsonString;
            onContentChangeRef.current(jsonString);
          }
        }
      };

      window.addEventListener("blur", handleWindowBlur);
      return () => window.removeEventListener("blur", handleWindowBlur);
    }, [editor]);

    // Handle page link navigation
    useEffect(() => {
      const handleNavigateToPage = (e: CustomEvent<{ pageId: string }>) => {
        loadNote(e.detail.pageId);
      };

      window.addEventListener(
        "navigate-to-page",
        handleNavigateToPage as EventListener
      );
      return () => {
        window.removeEventListener(
          "navigate-to-page",
          handleNavigateToPage as EventListener
        );
      };
    }, [loadNote]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
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
    }, [editor]);

    if (!editor) {
      return null;
    }

    return (
      <div className="relative">
        <TiptapEditorContent editor={editor}>
          <SlashDropdownMenu editor={editor} />
          <PageLinkMenu />
          <FloatingToolbar editor={editor} />
        </TiptapEditorContent>
      </div>
    );
  }
);

EditorContent.displayName = "EditorContent";
