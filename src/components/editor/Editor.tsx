import { useCallback, useState, useRef } from "react";
import { ArrowLeft, DotsThree, Trash, Export } from "@phosphor-icons/react";
import { save } from "@tauri-apps/plugin-dialog";
import type { EditorView } from "@codemirror/view";
import { useNoteStore } from "../../stores/noteStore";
import { EDITOR_CONFIG } from "../../lib/config";
import {
  Button,
  IconButton,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "../ui";
import { DeleteNoteModal } from "../notes/DeleteNoteModal";
import { EditorToolbar } from "./EditorToolbar";
import { EditorContent, type EditorContentRef } from "./EditorContent";

interface EditorProps {
  noteId: string;
  content: string;
}

export function Editor({ noteId, content }: EditorProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const editorRef = useRef<EditorContentRef>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  const currentNote = useNoteStore((state) => state.currentNote);

  // Handle back navigation
  const handleBack = useCallback(() => {
    useNoteStore.setState({ currentNote: null });
    useNoteStore.getState().loadNotes();
  }, []);

  // Handle delete
  const handleDelete = useCallback(async () => {
    await useNoteStore.getState().deleteNote(noteId);
    setShowDeleteModal(false);
    handleBack();
  }, [noteId, handleBack]);

  // Handle export
  const handleExport = useCallback(async () => {
    const note = useNoteStore.getState().currentNote;
    if (!note) return;

    const filePath = await save({
      defaultPath: `${note.title || "untitled"}.md`,
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });

    if (filePath) {
      await useNoteStore.getState().exportCurrentNote(filePath);
    }
  }, []);

  // Debounced content save
  const handleContentChange = useCallback((newContent: string) => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      useNoteStore.getState().saveCurrentNoteContent(newContent);
    }, EDITOR_CONFIG.autosaveDelay);
  }, []);

  // Title change handler
  const handleTitleChange = useCallback(
    (title: string) => {
      const note = useNoteStore.getState().currentNote;
      if (note && title !== note.title) {
        useNoteStore.getState().updateNote(noteId, { title });
      }
    },
    [noteId]
  );

  // Get editor view when content is ready
  const handleViewReady = useCallback((view: EditorView) => {
    setEditorView(view);
  }, []);

  return (
    <>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-card">
        {/* Header with drag region */}
        <div
          className="h-[50px] shrink-0 flex items-center justify-between border-b border-border px-4"
          data-tauri-drag-region
        >
          <div className="flex items-center gap-3 [-webkit-app-region:no-drag]">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="hover:bg-transparent px-0!"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <span className="text-border">|</span>
            <span className="font-medium text-foreground truncate">
              {currentNote?.title || "Untitled"}
            </span>
          </div>

          {/* Dropdown Menu */}
          <div className="[-webkit-app-region:no-drag]">
            <Dropdown>
              <DropdownTrigger>
                <IconButton size="sm" title="More options">
                  <DotsThree className="w-5 h-5" weight="bold" />
                </IconButton>
              </DropdownTrigger>

              <DropdownContent align="end">
                <DropdownItem onClick={handleExport}>
                  <Export className="w-4 h-4 text-muted-foreground" />
                  Export note
                </DropdownItem>

                <DropdownSeparator />

                <DropdownItem
                  onClick={() => setShowDeleteModal(true)}
                  variant="destructive"
                >
                  <Trash className="w-4 h-4" />
                  Delete note
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        </div>

        {/* Toolbar */}
        <EditorToolbar editorView={editorView} />

        {/* Editor Content */}
        <EditorContent
          ref={editorRef}
          noteId={noteId}
          content={content}
          onContentChange={handleContentChange}
          onTitleChange={handleTitleChange}
          onViewReady={handleViewReady}
        />
      </div>

      <DeleteNoteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        noteTitle={currentNote?.title}
      />
    </>
  );
}
