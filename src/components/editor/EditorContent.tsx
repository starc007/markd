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
import { SlashDropdownMenu } from "./slash-dropdown-menu";
import { FloatingToolbar } from "./floating-toolbar";

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
    const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);
    const saveTimeoutRef = useRef<number | null>(null);
    const noteIdRef = useRef<string | null>(null);
    const onContentChangeRef = useRef(onContentChange);
    const lastSavedContentRef = useRef<string>("");
    const isSwitchingNotesRef = useRef<boolean>(false);

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
            }
          }
        }, 500);
      },
      onCreate: ({ editor }) => {
        editorRef.current = editor;
      },
      onDestroy: () => {
        editorRef.current = null;
      },
    });

    // Update content when noteId changes
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

        // Reset last saved content when switching notes
        lastSavedContentRef.current = content;

        // Reset flag after a short delay to allow any pending updates to complete
        setTimeout(() => {
          isSwitchingNotesRef.current = false;
        }, 100);
      }
    }, [noteId, content, editor]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      focus: () => {
        editor?.commands.focus();
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
          <FloatingToolbar editor={editor} />
        </TiptapEditorContent>
      </div>
    );
  }
);

EditorContent.displayName = "EditorContent";
