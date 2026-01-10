import { useEffect, useState } from "react";
import { useBookmarkStore } from "../../stores/bookmarkStore";
import { useUIStore } from "../../stores/uiStore";
import { BookmarkInput } from "./BookmarkInput";
import { BookmarkList } from "./BookmarkList";

export function Bookmarks() {
  const selectedFolderId = useUIStore((state) => state.selectedFolderId);
  const { bookmarks, loadBookmarks, openBookmark } = useBookmarkStore();
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string | null>(null);

  useEffect(() => {
    loadBookmarks(selectedFolderId);
  }, [selectedFolderId, loadBookmarks]);

  const handleBookmarkSelect = (id: string) => {
    setSelectedBookmarkId(id);
    const bookmark = bookmarks.find((b) => b.id === id);
    if (bookmark) {
      openBookmark(bookmark.url);
    }
  };

  const handleBookmarkCreated = () => {
    // Bookmarks list will update automatically through store
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground mb-4">Bookmarks</h1>
        <BookmarkInput
          folderId={selectedFolderId}
          onBookmarkCreated={handleBookmarkCreated}
          autoFocus={true}
        />
      </div>

      {/* Bookmarks List */}
      <BookmarkList
        bookmarks={bookmarks}
        selectedId={selectedBookmarkId}
        onBookmarkSelect={handleBookmarkSelect}
      />
    </div>
  );
}
