import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
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
import type { SuggestionItem } from "../tiptap-ui-utils/suggestion-menu/suggestion-menu-types";
import type { Editor, Range } from "@tiptap/react";
import { FileIcon } from "../tiptap-icons/file-icon";
import { usePageCommand } from "../../hooks/usePageCommand";

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
    const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);
    const saveTimeoutRef = useRef<number | null>(null);
    const switchingTimeoutRef = useRef<number | null>(null);
    const noteIdRef = useRef<string | null>(noteId);
    const onContentChangeRef = useRef(onContentChange);
    const lastSavedContentRef = useRef<string>("");
    const isSwitchingNotesRef = useRef<boolean>(false);
    const isMountedRef = useRef<boolean>(true);
    const { loadNote } = useNoteStore();

    // Update noteId ref when it changes
    useEffect(() => {
      noteIdForLinksRef.current = noteId;
    }, [noteId]);

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

    const { handlePageCommand } = usePageCommand(
      noteId,
      extractAndSyncPageLinks
    );

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
          // Prevent execution if component has unmounted
          if (!isMountedRef.current) {
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
              extractAndSyncPageLinks(noteIdForLinksRef.current, json);
            } else {
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

    // Track last content to detect changes
    const lastContentRef = useRef<string>(content);

    // Update content when noteId changes or when content changes
    useEffect(() => {
      const noteIdChanged = noteIdRef.current !== noteId;
      const contentChanged = lastContentRef.current !== content;

      if ((noteIdChanged || contentChanged) && editor) {
        // Set flag to prevent saves during note switch or content update
        if (noteIdChanged) {
          isSwitchingNotesRef.current = true;
          noteIdRef.current = noteId;
        }

        // Clear any pending saves
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
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

          // Reset last saved content
          lastSavedContentRef.current = content || contentString;
        }

        // Always update the ref to track the latest content
        lastContentRef.current = content;

        // Reset flag after a short delay to allow any pending updates to complete
        if (switchingTimeoutRef.current) {
          window.clearTimeout(switchingTimeoutRef.current);
        }

        if (noteIdChanged) {
          switchingTimeoutRef.current = window.setTimeout(() => {
            if (isMountedRef.current) {
              isSwitchingNotesRef.current = false;
            }
            switchingTimeoutRef.current = null;
          }, 100);
        } else if (contentChanged) {
          // For content-only changes (like page link title updates), reset flag immediately
          isSwitchingNotesRef.current = false;
        }
      }
    }, [noteId, editor, content]); // Include content to update when note content changes

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
        // Don't save if component unmounted or switching notes
        if (!isMountedRef.current || isSwitchingNotesRef.current) {
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
      const handleNavigateToPage = async (
        e: CustomEvent<{ pageId: string }>
      ) => {
        try {
          await loadNote(e.detail.pageId);
        } catch (error) {
          console.error("Failed to navigate to page:", error);
          useNoteStore.setState({
            error: `Failed to load page: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          });
        }
      };

      window.addEventListener(
        "navigate-to-page",
        handleNavigateToPage as unknown as EventListener
      );
      return () => {
        window.removeEventListener(
          "navigate-to-page",
          handleNavigateToPage as unknown as EventListener
        );
      };
    }, [loadNote]);

    // Cleanup on unmount
    useEffect(() => {
      // Set mounted flag on mount
      isMountedRef.current = true;

      return () => {
        // Mark component as unmounted FIRST to prevent any pending callbacks from executing
        isMountedRef.current = false;

        // Clear all pending timeouts
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
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
    }, [editor]);

    if (!editor) {
      return null;
    }

    // Custom slash menu items
    const customSlashItems: SuggestionItem[] = [
      {
        title: "Page",
        subtext: "Create a sub-page and link it here",
        keywords: ["page", "new page", "link"],
        badge: FileIcon,
        group: "Basic",
        onSelect: ({ editor, range }: { editor: Editor; range: Range }) => {
          handlePageCommand(editor, range);
        },
      },
    ];

    return (
      <div className="relative">
        <TiptapEditorContent editor={editor}>
          <SlashDropdownMenu
            editor={editor}
            config={{
              customItems: customSlashItems,
            }}
          />
          <PageLinkMenu />
          <FloatingToolbar editor={editor} />
        </TiptapEditorContent>
      </div>
    );
  }
);

EditorContent.displayName = "EditorContent";
