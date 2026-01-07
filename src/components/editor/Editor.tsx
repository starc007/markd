import { useEffect, useRef, useCallback, useState } from "react";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { ArrowLeft, DotsThree, Trash, Export } from "@phosphor-icons/react";
import { save } from "@tauri-apps/plugin-dialog";
import { createEditorSetup } from "../../lib/codemirror/setup";
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

interface EditorProps {
  noteId: string;
  content: string;
}

export function Editor({ noteId, content }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const initialContentRef = useRef(content);
  const noteIdRef = useRef(noteId);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Store refs for callbacks to avoid dependency issues
  const storeRef = useRef(useNoteStore.getState());
  useEffect(() => {
    storeRef.current = useNoteStore.getState();
  });

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
    const currentNote = useNoteStore.getState().currentNote;
    if (!currentNote) return;

    const filePath = await save({
      defaultPath: `${currentNote.title || "untitled"}.md`,
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });

    if (filePath) {
      await useNoteStore.getState().exportCurrentNote(filePath);
    }
  }, []);

  // Initialize editor only when noteId changes
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous editor
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    // Store the noteId for this editor instance
    noteIdRef.current = noteId;
    initialContentRef.current = content;

    // Debounced save
    let saveTimeoutId: number | null = null;
    const debouncedSave = (newContent: string) => {
      if (saveTimeoutId) {
        window.clearTimeout(saveTimeoutId);
      }
      saveTimeoutId = window.setTimeout(() => {
        storeRef.current.saveCurrentNoteContent(newContent);
      }, EDITOR_CONFIG.autosaveDelay);
    };

    // Create update listener
    const onUpdate = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newContent = update.state.doc.toString();
        debouncedSave(newContent);

        // Extract title from first line
        const firstLine = newContent.split("\n")[0];
        const title = firstLine.replace(/^#+\s*/, "").trim() || "Untitled";
        const currentNote = storeRef.current.currentNote;
        if (currentNote && title !== currentNote.title) {
          storeRef.current.updateNote(noteIdRef.current, { title });
        }
      }
    });

    // Create editor state
    const state = EditorState.create({
      doc: content,
      extensions: [...createEditorSetup(), onUpdate],
    });

    // Create editor view
    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    // Focus the editor after a short delay
    requestAnimationFrame(() => {
      view.focus();
    });

    // Cleanup
    return () => {
      if (saveTimeoutId) {
        window.clearTimeout(saveTimeoutId);
      }
      view.destroy();
    };
  }, [noteId]); // Only depend on noteId

  const currentNote = useNoteStore((state) => state.currentNote);

  return (
    <>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-card">
        {/* Draggable region for macOS */}
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

        {/* Editor Content */}
        <div ref={containerRef} className="flex-1 overflow-y-auto" />
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
