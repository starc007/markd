import {
  useRef,

  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import { BannerSelector, type BannerType } from "@/features/visual-identity/components";
import { normalizeBannerType } from "@/features/visual-identity/utils/util";


interface EditorTitleProps {
  title: string;
  onTitleChange: (title: string) => void;
  onEnter?: () => void;
  onBannerChange?: (type: BannerType) => void;
  currentBanner?: BannerType;
  noteId: string;
}

export interface EditorTitleRef {
  focus: () => void;
  selectAll: () => void;
  getValue: () => string;
}

export const EditorTitle = forwardRef<EditorTitleRef, EditorTitleProps>(
  (
    {
      title,
      onTitleChange,
      onEnter,
      onBannerChange,
      currentBanner,
      noteId,
    },
    ref,
  ) => {

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isUpdatingRef = useRef(false);
    const [isHovered, setIsHovered] = useState(false);

    // Update textarea value when noteId changes
    // useEffect(() => {
    //   if (noteIdRef.current !== noteId) {
    //     noteIdRef.current = noteId;
    //     if (textareaRef.current && !isUpdatingRef.current) {
    //       textareaRef.current.value = title || "";
    //       // Auto-resize textarea
    //       textareaRef.current.style.height = "auto";
    //       textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    //     }
    //   }
    // }, [noteId, title]);


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

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
      selectAll: () => {
        textareaRef.current?.select();
      },
      getValue: () => {
        return textareaRef.current?.value || "";
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
          className="w-full outline-none border-none bg-transparent text-[42px] font-[760] leading-[1.05] placeholder:text-muted-foreground/35 resize-none overflow-hidden text-foreground"
          style={{
            minHeight: "58px",
          }}
          rows={1}
        />
        {isHovered && onBannerChange && (
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <BannerSelector
              currentBanner={normalizeBannerType(currentBanner)}
              onSelect={onBannerChange}
              noteId={noteId}
            />
          </div>
        )}
      </div>
    );
  },
);

EditorTitle.displayName = "EditorTitle";
