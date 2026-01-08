import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { useEditor, EditorContent as TiptapEditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { markdownToJSON, jsonToMarkdown } from "../../lib/tiptap/converter";
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

    // Keep callback ref updated
    useEffect(() => {
      onContentChangeRef.current = onContentChange;
    }, [onContentChange]);

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
      content: markdownToJSON(content),
      editorProps: {
        attributes: {
          class: "tiptap-editor focus:outline-none",
        },
      },
      onUpdate: ({ editor }) => {
        // Clear previous timeout
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
        }

        // Debounce saves - save after 500ms of no changes
        saveTimeoutRef.current = window.setTimeout(() => {
          if (editorRef.current && onContentChangeRef.current) {
            const json = editor.getJSON();
            const markdown = jsonToMarkdown(json);
            onContentChangeRef.current(markdown);
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
        noteIdRef.current = noteId;
        const json = markdownToJSON(content);
        editor.commands.setContent(json);
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
        if (editor && saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        if (editor) {
          const json = editor.getJSON();
          const markdown = jsonToMarkdown(json);
          onContentChangeRef.current(markdown);
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
        if (editor) {
          const json = editor.getJSON();
          const markdown = jsonToMarkdown(json);
          onContentChangeRef.current(markdown);
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
