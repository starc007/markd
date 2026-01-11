import { useEffect, useState, useRef } from "react";
import { useBookmarkStore } from "../../stores/bookmarkStore";
import { useUIStore } from "../../stores/uiStore";
import { BookmarkInput, BookmarkInputRef } from "./BookmarkInput";
import { BookmarkList } from "./BookmarkList";
import { BookmarkEditModal } from "./BookmarkEditModal";
import type { BookmarkMetadata } from "../../lib/tauri/commands";
import { HugeiconsIcon } from "@hugeicons/react";
import { CommandIcon } from "@hugeicons/core-free-icons";

export function Bookmarks() {
  const selectedFolderId = useUIStore((state) => state.selectedFolderId);
  const { bookmarks, loadBookmarks, openBookmark } = useBookmarkStore();
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string | null>(
    null
  );
  const [editingBookmark, setEditingBookmark] =
    useState<BookmarkMetadata | null>(null);
  const inputRef = useRef<BookmarkInputRef>(null);

  useEffect(() => {
    loadBookmarks(selectedFolderId);
  }, [selectedFolderId, loadBookmarks]);

  // Keyboard shortcut: Cmd+F to focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Cmd+F to focus input
      if (isMod && e.key === "f") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleBookmarkSelect = (id: string) => {
    setSelectedBookmarkId(id);
    const bookmark = bookmarks.find((b) => b.id === id);
    if (bookmark) {
      openBookmark(bookmark.url);
    }
  };

  const handleEditBookmark = (bookmark: BookmarkMetadata) => {
    setEditingBookmark(bookmark);
  };

  const handleCloseEditModal = () => {
    setEditingBookmark(null);
  };

  return (
    <div className="flex flex-col h-full bg-background px-28 py-10">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-foreground">Bookmarks</h1>
          {/* Keyboard Shortcuts */}
          <div className="flex gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded border border-border font-mono">
                ↵
              </kbd>
              <span>Open</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="flex items-center gap-0.5 px-2 py-1 bg-muted rounded border border-border">
                <HugeiconsIcon
                  icon={CommandIcon}
                  size={12}
                  color="currentColor"
                  strokeWidth={2}
                />
                <span className="font-mono">C</span>
              </kbd>
              <span>Copy URL</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded border border-border font-mono">
                E
              </kbd>
              <span>Edit</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded border border-border font-mono">
                ⌫
              </kbd>
              <span>Delete</span>
            </div>
          </div>
        </div>
        <BookmarkInput
          ref={inputRef}
          folderId={selectedFolderId}
          autoFocus={true}
        />
      </div>

      {/* Bookmarks List */}
      <BookmarkList
        bookmarks={bookmarks}
        selectedId={selectedBookmarkId}
        onBookmarkSelect={handleBookmarkSelect}
        onEditBookmark={handleEditBookmark}
      />

      {/* Edit Modal */}
      <BookmarkEditModal
        bookmark={editingBookmark}
        isOpen={!!editingBookmark}
        onClose={handleCloseEditModal}
      />
    </div>
  );
}
