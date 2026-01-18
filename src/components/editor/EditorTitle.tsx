import {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import { BannerSelector, type BannerType } from "./BannerSelector";

interface EditorTitleProps {
  title: string;
  noteId: string;
  content: string;
  onTitleChange: (title: string) => void;
  onEnter?: () => void;
  onBannerChange?: (type: BannerType) => void;
  currentBanner?: BannerType;
}

export interface EditorTitleRef {
  focus: () => void;
}

export const EditorTitle = forwardRef<EditorTitleRef, EditorTitleProps>(
  (
    {
      title,
      noteId,
      content: _content,
      onTitleChange,
      onEnter,
      onBannerChange,
      currentBanner,
    },
    ref,
  ) => {
    // _content is passed for consistency but not currently used
    void _content;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const noteIdRef = useRef(noteId);
    const isUpdatingRef = useRef(false);
    const [isHovered, setIsHovered] = useState(false);

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
      <div
        ref={containerRef}
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
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
        {isHovered && onBannerChange && currentBanner === "none" && (
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <BannerSelector
              currentBanner={currentBanner}
              onSelect={onBannerChange}
            />
          </div>
        )}
      </div>
    );
  },
);

EditorTitle.displayName = "EditorTitle";
