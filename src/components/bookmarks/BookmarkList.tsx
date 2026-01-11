import {
  useState,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LinkIcon,
  Delete02Icon,
  Copy01Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons";
import type { BookmarkMetadata } from "../../lib/tauri/commands";
import { useBookmarkStore } from "../../stores/bookmarkStore";
import { toast } from "sonner";

// Format timestamp to relative time (e.g., "2h ago", "3d ago")
function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

interface BookmarkListProps {
  bookmarks: BookmarkMetadata[];
  onEditBookmark?: (bookmark: BookmarkMetadata) => void;
  focusedIndex?: number;
  onFocusedIndexChange?: (index: number) => void;
  onReturnFocusToInput?: () => void;
}

export interface BookmarkListRef {
  focus: () => void;
}

export const BookmarkList = forwardRef<BookmarkListRef, BookmarkListProps>(
  (
    {
      bookmarks,
      onEditBookmark,
      focusedIndex: controlledFocusedIndex,
      onFocusedIndexChange,
      onReturnFocusToInput,
    },
    ref
  ) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [internalFocusedIndex, setInternalFocusedIndex] = useState<number>(0);
    const listRef = useRef<HTMLDivElement>(null);

    // Use controlled focusedIndex if provided, otherwise use internal state
    const focusedIndex =
      controlledFocusedIndex !== undefined
        ? controlledFocusedIndex
        : internalFocusedIndex;
    const setFocusedIndex = onFocusedIndexChange || setInternalFocusedIndex;

    useImperativeHandle(ref, () => ({
      focus: () => {
        listRef.current?.focus();
      },
    }));
    const { openBookmark, copyBookmarkUrl, deleteBookmark } =
      useBookmarkStore();

    const handleCopy = useCallback(
      (bookmark: BookmarkMetadata, e: React.MouseEvent) => {
        e.stopPropagation();
        copyBookmarkUrl(bookmark.url);
        toast.success("URL copied to clipboard");
      },
      [copyBookmarkUrl]
    );

    const handleDelete = useCallback(
      async (
        bookmark: BookmarkMetadata,
        e: React.MouseEvent | KeyboardEvent
      ) => {
        e.stopPropagation();

        // Find the index of the bookmark being deleted
        const deletedIndex = bookmarks.findIndex((b) => b.id === bookmark.id);
        if (deletedIndex === -1) return;

        try {
          await deleteBookmark(bookmark.id);
          toast.success("Bookmark deleted");

          // Adjust focusedIndex after deletion
          // After deletion, the array will be one item shorter
          if (bookmarks.length > 1) {
            // If deleted item was at or after focused index, adjust
            if (deletedIndex <= focusedIndex) {
              // If we're deleting the focused item or one before it,
              // move to the item that takes its place (or previous if it was last)
              if (deletedIndex === bookmarks.length - 1) {
                // Deleted last item, move to previous
                setFocusedIndex(Math.max(0, focusedIndex - 1));
              } else if (deletedIndex === focusedIndex) {
                // Deleted focused item, stay at same index (next item moves up)
                setFocusedIndex(Math.min(focusedIndex, bookmarks.length - 2));
              } else {
                // Deleted item before focused, focused index decreases by 1
                setFocusedIndex(focusedIndex - 1);
              }
            }
            // If deleted item was after focused index, no adjustment needed
          } else {
            // No bookmarks left, return focus to input
            setFocusedIndex(0);
            onReturnFocusToInput?.();
          }
        } catch (error) {
          console.error("Failed to delete bookmark:", error);
          toast.error(
            `Failed to delete bookmark: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      },
      [
        deleteBookmark,
        focusedIndex,
        bookmarks,
        setFocusedIndex,
        onReturnFocusToInput,
      ]
    );

    const handleEdit = useCallback(
      (bookmark: BookmarkMetadata, e: React.MouseEvent) => {
        e.stopPropagation();
        onEditBookmark?.(bookmark);
      },
      [onEditBookmark]
    );

    if (bookmarks.length === 0) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <HugeiconsIcon
              icon={LinkIcon}
              size={48}
              color="currentColor"
              strokeWidth={1.5}
              className="text-muted-foreground/40 mx-auto mb-4"
            />
            <p className="text-sm text-muted-foreground">No bookmarks yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Paste a URL above to save your first bookmark
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto outline-none"
        tabIndex={0}
      >
        <div className="space-y-2 p-6">
          {bookmarks.map((bookmark, index) => {
            const isHovered = hoveredId === bookmark.id;
            const isFocused = focusedIndex === index;

            return (
              <div
                key={bookmark.id}
                className={`
                group relative px-2 py-1 cursor-pointer rounded-lg
                transition-all duration-200
                ${
                  isFocused
                    ? "bg-accent/80 border-accent-foreground/10"
                    : "hover:bg-accent/30 hover:border-accent-foreground/10"
                }
              `}
                onClick={(e) => {
                  e.stopPropagation();
                  setFocusedIndex(index);
                  openBookmark(bookmark.url);
                }}
                onMouseEnter={() => setHoveredId(bookmark.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="flex items-center gap-1">
                  {/* Favicon or fallback icon */}
                  <div className="shrink-0 py-2 rounded-lg flex items-center justify-center w-10 h-10">
                    {bookmark.favicon ? (
                      <img
                        src={bookmark.favicon}
                        alt=""
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Fallback to icon if favicon fails to load
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                    {!bookmark.favicon && (
                      <HugeiconsIcon
                        icon={LinkIcon}
                        size={16}
                        color="currentColor"
                        strokeWidth={2}
                        className="text-primary"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      {/* Title */}
                      <div className="font-semibold text-[15px] text-foreground truncate">
                        {bookmark.title}
                      </div>

                      {/* URL */}
                      <div className="text-[12px] text-muted-foreground/60 truncate font-mono">
                        {bookmark.url}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp and Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Timestamp - visible when not hovered/focused */}
                    {!isHovered && (
                      <div className="text-[11px] text-muted-foreground/50 font-mono">
                        {formatTimestamp(bookmark.created_at)}
                      </div>
                    )}

                    {/* Action buttons - visible when hovered/focused */}
                    {isHovered && (
                      <div className="flex items-center gap-1 transition-opacity">
                        <button
                          onClick={(e) => handleEdit(bookmark, e)}
                          className="p-2 hover:bg-accent/80 rounded-lg transition-colors"
                          title="Edit (E)"
                          aria-label="Edit bookmark"
                        >
                          <HugeiconsIcon
                            icon={Edit02Icon}
                            size={16}
                            color="currentColor"
                            strokeWidth={2}
                          />
                        </button>
                        <button
                          onClick={(e) => handleCopy(bookmark, e)}
                          className="p-2 hover:bg-accent/80 rounded-lg transition-colors"
                          title="Copy URL (Cmd+C)"
                          aria-label="Copy URL"
                        >
                          <HugeiconsIcon
                            icon={Copy01Icon}
                            size={16}
                            color="currentColor"
                            strokeWidth={2}
                          />
                        </button>
                        <button
                          onClick={(e) => handleDelete(bookmark, e)}
                          className="p-2 hover:bg-destructive/15 hover:text-destructive rounded-lg transition-colors"
                          title="Delete (Backspace)"
                          aria-label="Delete bookmark"
                        >
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            size={16}
                            color="currentColor"
                            strokeWidth={2}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

BookmarkList.displayName = "BookmarkList";
