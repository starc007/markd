import { useRef, useEffect } from "react";

interface EditorTitleProps {
  title: string;
  noteId: string;
  onTitleChange: (title: string) => void;
  onEnter?: () => void;
}

export function EditorTitle({
  title,
  noteId,
  onTitleChange,
  onEnter,
}: EditorTitleProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteIdRef = useRef(noteId);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    // Only update if noteId changed (switching notes), not when title changes
    if (noteIdRef.current !== noteId) {
      noteIdRef.current = noteId;
      if (textareaRef.current && !isUpdatingRef.current) {
        textareaRef.current.value = title || "";
        // Auto-resize textarea
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  }, [noteId]); // Only depend on noteId, not title

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

  return (
    <textarea
      ref={textareaRef}
      defaultValue={title || ""}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="Untitled"
      className="w-full outline-none border-none bg-transparent text-[40px] font-bold leading-tight mb-2 placeholder:text-muted-foreground/40 resize-none overflow-hidden"
      style={{
        minHeight: "60px",
        padding: "3px 2px",
        lineHeight: "1.2",
      }}
      rows={1}
    />
  );
}
