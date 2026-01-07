import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { createEditorSetup } from "../../lib/codemirror/setup";

interface EditorContentProps {
  content: string;
  noteId: string;
  onContentChange: (content: string) => void;
  onTitleChange: (title: string) => void;
  onViewReady?: (view: EditorView) => void;
}

export interface EditorContentRef {
  getView: () => EditorView | null;
  focus: () => void;
}

export const EditorContent = forwardRef<EditorContentRef, EditorContentProps>(
  ({ content, noteId, onContentChange, onTitleChange, onViewReady }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const noteIdRef = useRef(noteId);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      getView: () => viewRef.current,
      focus: () => viewRef.current?.focus(),
    }));

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

      // Create update listener
      const onUpdate = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString();
          onContentChange(newContent);

          // Extract title from first line
          const firstLine = newContent.split("\n")[0];
          const title = firstLine.replace(/^#+\s*/, "").trim() || "Untitled";
          onTitleChange(title);
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

      // Notify parent that view is ready
      onViewReady?.(view);

      // Focus the editor after a short delay
      requestAnimationFrame(() => {
        view.focus();
      });

      // Cleanup
      return () => {
        view.destroy();
      };
    }, [noteId]); // Only depend on noteId - callbacks are stable refs

    return <div ref={containerRef} className="flex-1 overflow-y-auto" />;
  }
);

EditorContent.displayName = "EditorContent";
