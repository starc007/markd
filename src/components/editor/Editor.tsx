import { useEffect, useRef, useCallback } from "react";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { ArrowLeft } from "@phosphor-icons/react";
import { createEditorSetup } from "../../lib/codemirror/setup";
import { useNoteStore } from "../../stores/noteStore";
import { EDITOR_CONFIG } from "../../lib/config";
import { Button } from "../ui";

interface EditorProps {
  noteId: string;
  content: string;
}

export function Editor({ noteId, content }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const initialContentRef = useRef(content);
  const noteIdRef = useRef(noteId);

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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-card">
      {/* Draggable region for macOS */}
      <div
        className="h-[50px] shrink-0 flex items-center border-b border-border px-4"
        data-tauri-drag-region
      >
        <div className="flex items-center gap-3 [-webkit-app-region:no-drag]">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="hover:bg-transparent !px-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <span className="text-border">|</span>
          <span className="font-medium text-foreground truncate">
            {currentNote?.title || "Untitled"}
          </span>
        </div>
      </div>

      {/* Editor Content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto" />
    </div>
  );
}
