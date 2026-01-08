import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";

interface EditorTitleProps {
  title: string;
  noteId: string;
  onTitleChange: (title: string) => void;
  onEnter?: () => void;
}

export interface EditorTitleRef {
  focus: () => void;
}

export const EditorTitle = forwardRef<EditorTitleRef, EditorTitleProps>(
  ({ title, noteId, onTitleChange, onEnter }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const noteIdRef = useRef(noteId);
    const isUpdatingRef = useRef(false);

    // Update textarea value when noteId changes
    useEffect(() => {
      if (noteIdRef.current !== noteId) {
        noteIdRef.current = noteId;
        if (textareaRef.current && !isUpdatingRef.current) {
          textareaRef.current.value = title || "";
          // Auto-resize textarea
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      }
    }, [noteId, title]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      isUpdatingRef.current = true;
      const newTitle = e.target.value; // Don't trim or set default - allow empty

      // Auto-resize textarea
      e.target.style.height = "auto";
      e.target.style.height = `${e.target.scrollHeight}px`;

      // Only update if title actually changed (avoid unnecessary updates)
      const trimmedTitle = newTitle.trim();
      onTitleChange(trimmedTitle || ""); // Pass empty string, not "Untitled"

      // Reset flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (onEnter) {
          onEnter();
        }
      }
    };

    // Expose focus method to parent
    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

    return (
      <textarea
        ref={textareaRef}
        defaultValue={title || ""}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Untitled"
        className="w-full outline-none border-none bg-transparent text-[36px] font-bold leading-tight placeholder:text-muted-foreground/40 resize-none overflow-hidden text-primary"
        style={{
          lineHeight: "1.2",
          minHeight: "60px",
        }}
        rows={1}
      />
    );
  }
);

EditorTitle.displayName = "EditorTitle";
