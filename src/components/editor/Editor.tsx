import { useCallback, useState, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreVerticalIcon,
  DeleteIcon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import { save } from "@tauri-apps/plugin-dialog";
import { useNoteStore } from "../../stores/noteStore";
import { EDITOR_CONFIG } from "../../lib/config";
import {
  IconButton,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "../ui";
import { DeleteNoteModal } from "../notes/DeleteNoteModal";
import { EditorTitle } from "./EditorTitle";
import { EditorContent, type EditorContentRef } from "./EditorContent";
import { AppProvider } from "../../context/app-context";

interface EditorProps {
  noteId: string;
  content: string;
}

export function Editor({ noteId, content }: EditorProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
      // Use "Untitled" only for saving/display, but allow empty during editing
      const displayTitle = title.trim() || "Untitled";
      // Only update if the display title (with "Untitled" fallback) is different
      // This allows the user to clear the title without it immediately coming back
      if (note && displayTitle !== (note.title || "Untitled")) {
        useNoteStore.getState().updateNote(noteId, { title: displayTitle });
      }
    },
    [noteId]
  );

  // Handle Enter in title to focus content editor
  const handleTitleEnter = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  return (
    <>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-card">
        {/* Header with drag region */}
        <div
          className="h-[50px] shrink-0 flex items-center justify-between border-b border-sidebar-border px-4"
          data-tauri-drag-region
        >
          <div className="flex items-center gap-3 [-webkit-app-region:no-drag]">
            <span className="font-medium text-foreground truncate">
              {currentNote?.title || "Untitled"}
            </span>
          </div>

          {/* Dropdown Menu */}
          <div className="[-webkit-app-region:no-drag]">
            <Dropdown>
              <DropdownTrigger>
                <IconButton size="sm" title="More options">
                  <HugeiconsIcon
                    icon={MoreVerticalIcon}
                    size={20}
                    color="currentColor"
                    strokeWidth={1.5}
                  />
                </IconButton>
              </DropdownTrigger>

              <DropdownContent align="end">
                <DropdownItem onClick={handleExport}>
                  <HugeiconsIcon
                    icon={Download01Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.5}
                    className="text-muted-foreground"
                  />
                  Export note
                </DropdownItem>

                <DropdownSeparator />

                <DropdownItem
                  onClick={() => setShowDeleteModal(true)}
                  variant="destructive"
                >
                  <HugeiconsIcon
                    icon={DeleteIcon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.5}
                  />
                  Delete note
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        </div>

        {/* Editor Content - Notion style */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[900px] mx-auto px-12 py-8">
            {/* Title Editor */}
            <EditorTitle
              title={currentNote?.title || ""}
              noteId={noteId}
              onTitleChange={handleTitleChange}
              onEnter={handleTitleEnter}
            />

            {/* Content Editor */}
            <AppProvider>
              <EditorContent
                ref={editorRef}
                noteId={noteId}
                content={content}
                onContentChange={handleContentChange}
              />
            </AppProvider>
          </div>
        </div>
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
