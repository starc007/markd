import { useEffect, useRef, useCallback } from "react";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { ArrowLeft } from "@phosphor-icons/react";
import { createEditorSetup } from "../../lib/codemirror/setup";
import { useNoteStore } from "../../stores/noteStore";
import { EDITOR_CONFIG } from "../../lib/config";

interface EditorProps {
  noteId: string;
  content: string;
}

export function Editor({ noteId, content }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const contentRef = useRef(content);
  const { saveCurrentNoteContent, updateNote, currentNote, loadNotes } =
    useNoteStore();

  // Debounced save function
  const saveTimeoutRef = useRef<number | null>(null);
  const debouncedSave = useCallback(
    (newContent: string) => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = window.setTimeout(() => {
        saveCurrentNoteContent(newContent);
      }, EDITOR_CONFIG.autosaveDelay);
    },
    [saveCurrentNoteContent]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const onUpdate = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newContent = update.state.doc.toString();
        contentRef.current = newContent;
        debouncedSave(newContent);

        // Extract title from first line
        const firstLine = newContent.split("\n")[0];
        const title = firstLine.replace(/^#+\s*/, "").trim() || "Untitled";
        if (currentNote && title !== currentNote.title) {
          updateNote(noteId, { title });
        }
      }
    });

    const state = EditorState.create({
      doc: content,
      extensions: [...createEditorSetup(), onUpdate],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    // Focus the editor
    view.focus();

    return () => {
      view.destroy();
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [noteId, content, debouncedSave, currentNote, updateNote]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    useNoteStore.setState({ currentNote: null });
    loadNotes();
  }, [loadNotes]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-card">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
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
