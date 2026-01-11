import {
  useState,
  useCallback,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useBookmarkStore } from "../../stores/bookmarkStore";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddIcon, CommandIcon } from "@hugeicons/core-free-icons";

interface BookmarkInputProps {
  folderId?: string | null;
  autoFocus?: boolean;
  onArrowKey?: (direction: "up" | "down") => void;
}

export interface BookmarkInputRef {
  focus: () => void;
}

export const BookmarkInput = forwardRef<BookmarkInputRef, BookmarkInputProps>(
  ({ folderId, autoFocus = false, onArrowKey }, ref) => {
    const [url, setUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { createBookmark } = useBookmarkStore();

    useEffect(() => {
      if (autoFocus && inputRef.current) {
        inputRef.current.focus();
      }
    }, [autoFocus]);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    // Normalize URL: add https:// if missing, trim whitespace
    const normalizeUrl = useCallback((inputUrl: string): string => {
      let normalized = inputUrl.trim();

      // Remove trailing slashes (except for root URLs)
      normalized = normalized.replace(/\/+$/, "");

      // Add https:// if no protocol is specified
      if (!normalized.match(/^https?:\/\//i)) {
        normalized = `https://${normalized}`;
      }

      return normalized;
    }, []);

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedUrl = url.trim();
        if (!trimmedUrl) return;

        // Normalize URL
        const normalizedUrl = normalizeUrl(trimmedUrl);

        // Basic URL validation after normalization
        try {
          new URL(normalizedUrl);
        } catch {
          toast.error("Please enter a valid URL");
          return;
        }

        setIsSubmitting(true);

        try {
          // Don't send title - let backend fetch it from metadata
          await createBookmark(
            normalizedUrl,
            undefined, // title will be fetched from URL metadata in backend
            undefined,
            folderId || undefined
          );

          // Clear input immediately for fast workflow
          setUrl("");

          // Refocus input for next bookmark
          inputRef.current?.focus();
        } catch (error) {
          console.error("Failed to create bookmark:", error);
          toast.error(
            `Failed to save bookmark: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        } finally {
          setIsSubmitting(false);
        }
      },
      [url, folderId, createBookmark, normalizeUrl]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
          setUrl("");
          inputRef.current?.blur();
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          // Allow arrow keys to navigate the bookmark list even when input is focused
          e.preventDefault();
          onArrowKey?.(e.key === "ArrowDown" ? "down" : "up");
        }
      },
      [onArrowKey]
    );

    return (
      <form onSubmit={handleSubmit} className="w-full relative">
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground pointer-events-none">
          <HugeiconsIcon
            icon={AddIcon}
            size={20}
            color="currentColor"
            strokeWidth={2}
          />
        </div>
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste URL and press Enter..."
          disabled={isSubmitting}
          className="w-full pl-8 py-3 pr-20 text-sm rounded-lg bg-background border border-border
                   focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-transparent
                   placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all"
          autoComplete="off"
          spellCheck={false}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground pointer-events-none">
          <kbd className="flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded border border-border">
            <HugeiconsIcon
              icon={CommandIcon}
              size={12}
              color="currentColor"
              strokeWidth={2}
            />
            <span className="font-mono text-[12px]">F</span>
          </kbd>
        </div>
      </form>
    );
  }
);

BookmarkInput.displayName = "BookmarkInput";
