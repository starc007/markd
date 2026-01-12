import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { useEditor, EditorContent as TiptapEditorContent } from "@tiptap/react";
import { SlashDropdownMenu } from "./slash-dropdown-menu";
import { FloatingToolbar } from "./floating-toolbar";
import { PageLinkMenu } from "./PageLinkMenu";
import type { SuggestionItem } from "../tiptap-ui-utils/suggestion-menu/suggestion-menu-types";
import type { Editor, Range } from "@tiptap/react";
import { FileIcon } from "../tiptap-icons/file-icon";
import { usePageCommand } from "@/hooks/usePageCommand";
import { useEditorConfig, parseContent } from "@/hooks/useEditorConfig";
import { useEditorContentSync } from "@/hooks/useEditorContentSync";
import { useEditorEventHandlers } from "@/hooks/useEditorEventHandlers";

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
    const isSwitchingNotesRef = useRef<boolean>(false);
    const isMountedRef = useRef<boolean>(true);

    // Get editor extensions configuration
    const extensions = useEditorConfig();

    // Create refs to store handlers (will be set after hooks initialize)
    const handleContentUpdateRef = useRef<
      ((editor: Editor, transaction: any) => void) | null
    >(null);
    const extractAndSyncPageLinksRef = useRef<
      ((noteId: string, json: any) => Promise<void>) | null
    >(null);

    // Initialize editor - onUpdate will be set via ref after hook initializes
    const editor = useEditor({
      extensions,
      content: parseContent(content),
      editorProps: {
        attributes: {
          class: "tiptap-editor focus:outline-none",
        },
      },
      onUpdate: ({ editor, transaction }) => {
        // Call handler via ref to avoid circular dependency
        if (handleContentUpdateRef.current) {
          handleContentUpdateRef.current(editor, transaction);
        }
      },
      onCreate: ({ editor }) => {
        editorRef.current = editor;
      },
      onDestroy: () => {
        editorRef.current = null;
      },
    });

    // Setup content syncing and saving
    const { handleContentUpdate, extractAndSyncPageLinks } =
      useEditorContentSync({
        noteId,
        content,
        onContentChange,
        editor,
        isSwitchingNotesRef,
        isMountedRef,
      });

    // Store handlers in refs so onUpdate can access them
    useEffect(() => {
      handleContentUpdateRef.current = handleContentUpdate;
      extractAndSyncPageLinksRef.current = extractAndSyncPageLinks;
    }, [handleContentUpdate, extractAndSyncPageLinks]);

    // Setup page command handler
    const { handlePageCommand } = usePageCommand(
      noteId,
      extractAndSyncPageLinks
    );

    // Setup event handlers (page navigation, bookmark opening)
    useEditorEventHandlers();

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
          <PageLinkMenu editor={editor} currentNoteId={noteId} />
          <FloatingToolbar editor={editor} />
        </TiptapEditorContent>
      </div>
    );
  }
);

EditorContent.displayName = "EditorContent";
