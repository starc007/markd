import { useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LinkIcon,
  Delete02Icon,
  Copy01Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import type { BookmarkMetadata } from "../../lib/tauri/commands";
import { useBookmarkStore } from "../../stores/bookmarkStore";
import { toast } from "sonner";

interface BookmarkListProps {
  bookmarks: BookmarkMetadata[];
  selectedId?: string | null;
  onBookmarkSelect?: (id: string) => void;
}

export function BookmarkList({ bookmarks, selectedId, onBookmarkSelect }: BookmarkListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const { openBookmark, copyBookmarkUrl, deleteBookmark } = useBookmarkStore();

  const handleOpen = useCallback(
    async (bookmark: BookmarkMetadata, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await openBookmark(bookmark.url);
      } catch (error) {
        console.error("Failed to open bookmark:", error);
      }
    },
    [openBookmark]
  );

  const handleCopy = useCallback(
    (bookmark: BookmarkMetadata, e: React.MouseEvent) => {
      e.stopPropagation();
      copyBookmarkUrl(bookmark.url);
      toast.success("URL copied to clipboard");
      setMenuOpenId(null);
    },
    [copyBookmarkUrl]
  );

  const handleDelete = useCallback(
    async (bookmark: BookmarkMetadata, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await deleteBookmark(bookmark.id);
        toast.success("Bookmark deleted");
        setMenuOpenId(null);
      } catch (error) {
        console.error("Failed to delete bookmark:", error);
        toast.error(`Failed to delete bookmark: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    },
    [deleteBookmark]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, bookmark: BookmarkMetadata) => {
      if (e.key === "Enter") {
        openBookmark(bookmark.url);
      } else if (e.key === "c" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        copyBookmarkUrl(bookmark.url);
        toast.success("URL copied to clipboard");
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        deleteBookmark(bookmark.id);
      }
    },
    [openBookmark, copyBookmarkUrl, deleteBookmark]
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
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-1 p-2">
        {bookmarks.map((bookmark) => {
          const isSelected = selectedId === bookmark.id;
          const isHovered = hoveredId === bookmark.id;
          const isMenuOpen = menuOpenId === bookmark.id;

          return (
            <div
              key={bookmark.id}
              className={`
                group relative px-3 py-2.5 rounded-lg cursor-pointer
                transition-colors
                ${isSelected ? "bg-accent" : "hover:bg-accent/50"}
              `}
              onClick={(e) => {
                e.stopPropagation();
                onBookmarkSelect?.(bookmark.id);
              }}
              onMouseEnter={() => setHoveredId(bookmark.id)}
              onMouseLeave={() => setHoveredId(null)}
              onKeyDown={(e) => handleKeyDown(e, bookmark)}
              tabIndex={0}
              role="button"
              aria-label={`Bookmark: ${bookmark.title}`}
            >
              <div className="flex items-start gap-3">
                <HugeiconsIcon
                  icon={LinkIcon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.5}
                  className="text-muted-foreground mt-0.5 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">
                    {bookmark.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {bookmark.url}
                  </div>
                  {bookmark.description && (
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {bookmark.description}
                    </div>
                  )}
                  {bookmark.tags && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {bookmark.tags.split(",").map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs px-1.5 py-0.5 bg-secondary rounded text-secondary-foreground"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {(isHovered || isMenuOpen) && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleCopy(bookmark, e)}
                      className="p-1 hover:bg-accent rounded"
                      title="Copy URL (Cmd+C)"
                      aria-label="Copy URL"
                    >
                      <HugeiconsIcon
                        icon={Copy01Icon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                    </button>
                    <button
                      onClick={(e) => handleDelete(bookmark, e)}
                      className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                      title="Delete (Backspace)"
                      aria-label="Delete bookmark"
                    >
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
