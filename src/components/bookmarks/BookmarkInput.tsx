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

interface BookmarkInputProps {
  folderId?: string | null;
  autoFocus?: boolean;
}

export interface BookmarkInputRef {
  focus: () => void;
}

export const BookmarkInput = forwardRef<BookmarkInputRef, BookmarkInputProps>(
  ({ folderId, autoFocus = false }, ref) => {
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

    const extractTitleFromUrl = (url: string): string => {
      try {
        const urlObj = new URL(url);
        // Use hostname as default title
        return urlObj.hostname.replace("www.", "");
      } catch {
        return "Bookmark";
      }
    };

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedUrl = url.trim();
        if (!trimmedUrl) return;

        // Basic URL validation
        if (
          !trimmedUrl.startsWith("http://") &&
          !trimmedUrl.startsWith("https://")
        ) {
          toast.error(
            "Please enter a valid URL starting with http:// or https://",
          );
          return;
        }

        setIsSubmitting(true);

        try {
          const title = extractTitleFromUrl(trimmedUrl);
          await createBookmark(
            trimmedUrl,
            title,
            undefined,
            folderId || undefined,
          );

          // Clear input immediately for fast workflow
          setUrl("");

          toast.success("Bookmark saved");

          // Refocus input for next bookmark
          inputRef.current?.focus();
        } catch (error) {
          console.error("Failed to create bookmark:", error);
          toast.error(
            `Failed to save bookmark: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          );
        } finally {
          setIsSubmitting(false);
        }
      },
      [url, folderId, createBookmark],
    );

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setUrl("");
        inputRef.current?.blur();
      }
    }, []);

    return (
      <form onSubmit={handleSubmit} className="w-full">
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste URL and press Enter..."
          disabled={isSubmitting}
          className="w-full px-4 py-3 text-sm bg-background border border-border rounded-lg
                   focus:outline-none focus:ring-1 focus:ring-ring focus:border-transparent
                   placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all"
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    );
  },
);

BookmarkInput.displayName = "BookmarkInput";
