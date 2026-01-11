import { useState, useCallback, useEffect, useRef } from "react";
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
}

export function BookmarkList({ bookmarks, onEditBookmark }: BookmarkListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const listRef = useRef<HTMLDivElement>(null);
  const { openBookmark, copyBookmarkUrl, deleteBookmark } = useBookmarkStore();

  const handleCopy = useCallback(
    (bookmark: BookmarkMetadata, e: React.MouseEvent) => {
      e.stopPropagation();
      copyBookmarkUrl(bookmark.url);
      toast.success("URL copied to clipboard");
    },
    [copyBookmarkUrl]
  );

  const handleDelete = useCallback(
    async (bookmark: BookmarkMetadata, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await deleteBookmark(bookmark.id);
        toast.success("Bookmark deleted");
      } catch (error) {
        console.error("Failed to delete bookmark:", error);
        toast.error(
          `Failed to delete bookmark: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    [deleteBookmark]
  );

  const handleEdit = useCallback(
    (bookmark: BookmarkMetadata, e: React.MouseEvent) => {
      e.stopPropagation();
      onEditBookmark?.(bookmark);
    },
    [onEditBookmark]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (bookmarks.length === 0) return;

      const currentBookmark = bookmarks[focusedIndex];

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, bookmarks.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (currentBookmark) {
            openBookmark(currentBookmark.url);
          }
          break;
        case "e":
        case "E":
          e.preventDefault();
          if (currentBookmark) {
            onEditBookmark?.(currentBookmark);
          }
          break;
        case "c":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            if (currentBookmark) {
              copyBookmarkUrl(currentBookmark.url);
              toast.success("URL copied to clipboard");
            }
          }
          break;
        case "Backspace":
        case "Delete":
          e.preventDefault();
          if (currentBookmark) {
            deleteBookmark(currentBookmark.id);
          }
          break;
      }
    };

    listRef.current?.addEventListener("keydown", handleKeyDown);
    return () => listRef.current?.removeEventListener("keydown", handleKeyDown);
  }, [
    bookmarks,
    focusedIndex,
    openBookmark,
    copyBookmarkUrl,
    deleteBookmark,
    onEditBookmark,
  ]);

  // Auto-focus the list when mounted
  useEffect(() => {
    listRef.current?.focus();
  }, []);

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
                    ? "bg-accent/70 border-accent-foreground/10"
                    : "bg-card/50 hover:bg-accent/30 hover:border-accent-foreground/10"
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
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const icon = document.createElement("div");
                          icon.innerHTML =
                            parent.querySelector("svg")?.outerHTML || "";
                          parent.appendChild(icon);
                        }
                      }}
                    />
                  ) : (
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

                  {/* Tags */}
                  {bookmark.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {bookmark.tags.split(",").map((tag, i) => {
                        const colors = [
                          "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                          "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20",
                          "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20",
                          "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20",
                          "bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/20",
                          "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20",
                          "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                          "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20",
                        ];
                        const colorClass = colors[i % colors.length];

                        return (
                          <span
                            key={i}
                            className={`inline-flex items-center text-[11px] font-medium px-2 py-1 rounded-full ${colorClass}`}
                          >
                            {tag.trim()}
                          </span>
                        );
                      })}
                    </div>
                  )}
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
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
