import { useEffect, useRef, useCallback } from "react";
import { EditorView } from "@codemirror/view";
import { createEditorState } from "../../lib/codemirror/setup";
import { useNoteStore } from "../../stores/noteStore";

interface EditorProps {
  noteId?: string;
  content?: string;
  onChange?: (content: string) => void;
  onSave?: () => void;
}

export function Editor({
  noteId,
  content = "",
  onChange,
  onSave,
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const contentRef = useRef(content);

  // Debounced save
  const saveTimeoutRef = useRef<number | null>(null);
  const { saveCurrentNoteContent, isSaving } = useNoteStore();

  const handleChange = useCallback(
    (newContent: string) => {
      contentRef.current = newContent;
      onChange?.(newContent);

      // Debounced auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(() => {
        saveCurrentNoteContent(newContent);
      }, 500);
    },
    [onChange, saveCurrentNoteContent]
  );

  const handleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveCurrentNoteContent(contentRef.current);
    onSave?.();
  }, [onSave, saveCurrentNoteContent]);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    const state = createEditorState({
      initialContent: content,
      onChange: handleChange,
      onSave: handleSave,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [noteId]); // Recreate when noteId changes

  // Update content when it changes externally
  useEffect(() => {
    if (!viewRef.current) return;

    const currentContent = viewRef.current.state.doc.toString();
    if (content !== currentContent && content !== contentRef.current) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: content,
        },
      });
      contentRef.current = content;
    }
  }, [content]);

  // Cleanup save timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="editor-container">
      <div ref={containerRef} className="editor-content" />
      {isSaving && <div className="save-indicator">Saving...</div>}
    </div>
  );
}
