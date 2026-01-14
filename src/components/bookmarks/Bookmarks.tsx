import { useEffect, useState, useRef, useCallback } from "react";
import { useBookmarkStore } from "../../stores/bookmarkStore";

import { BookmarkInput, BookmarkInputRef } from "./BookmarkInput";
import { BookmarkList, BookmarkListRef } from "./BookmarkList";
import { BookmarkEditModal } from "./BookmarkEditModal";
import type { BookmarkMetadata } from "../../lib/tauri/commands";
import { HugeiconsIcon } from "@hugeicons/react";
import { CommandIcon } from "@hugeicons/core-free-icons";
import { BackspaceIcon } from "../tiptap-icons/backspace-icon";
import { EnterKeyIcon } from "../tiptap-icons/enter-key-icon";
import { ArrowUpIcon } from "../tiptap-icons/arrow-up-icon";
import { ArrowDownIcon } from "../tiptap-icons/arrow-down-icon";
import { toast } from "sonner";

export function Bookmarks() {
  const { bookmarks, loadBookmarks } = useBookmarkStore();

  const [editingBookmark, setEditingBookmark] =
    useState<BookmarkMetadata | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputRef = useRef<BookmarkInputRef>(null);
  const listRef = useRef<BookmarkListRef>(null);

  useEffect(() => {
    loadBookmarks(undefined);
  }, [loadBookmarks]);

  const handleEditBookmark = useCallback((bookmark: BookmarkMetadata) => {
    setEditingBookmark(bookmark);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setEditingBookmark(null);
  }, []);

  // Keyboard shortcuts: Cmd+F to focus input, Arrow keys for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      // Cmd+F to focus input
      if (isMod && e.key === "f") {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      // Arrow key navigation - only if not typing in an input
      if (!isInputFocused && bookmarks.length > 0) {
        const currentBookmark = bookmarks[focusedIndex];

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            const nextIndex = Math.min(focusedIndex + 1, bookmarks.length - 1);
            setFocusedIndex(nextIndex);
            // Focus the list to enable further keyboard navigation
            setTimeout(() => {
              listRef.current?.focus();
            }, 0);
            break;
          case "ArrowUp":
            e.preventDefault();
            if (focusedIndex === 0) {
              // If at top, return focus to input
              inputRef.current?.focus();
            } else {
              const prevIndex = Math.max(focusedIndex - 1, 0);
              setFocusedIndex(prevIndex);
              // Focus the list to enable further keyboard navigation
              setTimeout(() => {
                listRef.current?.focus();
              }, 0);
            }
            break;
          case "Enter":
            e.preventDefault();
            if (currentBookmark) {
              const { openBookmark } = useBookmarkStore.getState();
              openBookmark(currentBookmark.url);
            }
            break;
          case "e":
          case "E":
            e.preventDefault();
            if (currentBookmark) {
              handleEditBookmark(currentBookmark);
            }
            break;
          case "c":
            if (e.metaKey || e.ctrlKey) {
              e.preventDefault();
              if (currentBookmark) {
                const { copyBookmarkUrl } = useBookmarkStore.getState();
                copyBookmarkUrl(currentBookmark.url);
                toast.success("URL copied to clipboard");
              }
            }
            break;
          case "Backspace":
          case "Delete":
            e.preventDefault();
            if (currentBookmark) {
              const { deleteBookmark } = useBookmarkStore.getState();
              deleteBookmark(currentBookmark.id);
            }
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bookmarks, focusedIndex, handleEditBookmark]);

  return (
    <div className="flex flex-col h-full bg-background px-28 py-10">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-foreground">
            All Bookmarks
          </h1>
          {/* Keyboard Shortcuts */}
          <div className="flex gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <kbd className="p-1 bg-muted rounded border border-border font-mono">
                <ArrowUpIcon className="w-4 h-4" />
              </kbd>
              <kbd className="p-1 bg-muted rounded border border-border font-mono">
                <ArrowDownIcon className="w-4 h-4" />
              </kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="p-1 bg-muted rounded border border-border font-mono">
                <EnterKeyIcon className="w-4 h-4" />
              </kbd>
              <span>Open</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="flex items-center gap-0.5 p-1 bg-muted rounded border border-border">
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
              <kbd className="p-1 bg-muted rounded border border-border font-mono">
                E
              </kbd>
              <span>Edit</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="p-1 bg-muted rounded border border-border font-mono">
                <BackspaceIcon className="w-4 h-4" />
              </kbd>
              <span>Delete</span>
            </div>
          </div>
        </div>
        <BookmarkInput
          ref={inputRef}
          folderId={undefined}
          autoFocus={true}
          onArrowKey={(direction) => {
            if (bookmarks.length === 0) return;
            // Focus list when arrow keys are pressed (input will lose focus naturally)

            if (direction === "down") {
              // Start from first item when going down
              setFocusedIndex(0);
              // Focus list after state update
              setTimeout(() => {
                listRef.current?.focus();
              }, 0);
            } else if (direction === "up") {
              // When going up from input, go to last item
              setFocusedIndex(bookmarks.length - 1);
              // Focus list after state update
              setTimeout(() => {
                listRef.current?.focus();
              }, 0);
            }
          }}
        />
      </div>

      {/* Bookmarks List */}
      <BookmarkList
        ref={listRef}
        bookmarks={bookmarks}
        onEditBookmark={handleEditBookmark}
        focusedIndex={focusedIndex}
        onFocusedIndexChange={setFocusedIndex}
        onReturnFocusToInput={() => {
          inputRef.current?.focus();
        }}
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
