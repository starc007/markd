import { Command } from "cmdk";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNoteStore } from "@/stores/noteStore";
import { useTabStore } from "@/stores/tabStore";
import { useUIStore, UIView } from "@/stores/uiStore";
import { useStickyNotesStore } from "@/features/sticky-notes/stores/stickyNotesStore";
import { useBookmarkStore } from "@/features/bookmarks/stores/bookmarkStore";
import { save } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { RecentItems } from "./RecentItems";
import { CommandGroups } from "./CommandGroups";
import { SearchResults } from "./SearchResults";
import { EmptyStates } from "./EmptyStates";
import type { SearchResult } from "@/lib/tauri/commands";

const SEARCH_THRESHOLD = 2; // Only search after 2+ characters

export function CommandPalette() {
  const currentNote = useNoteStore((state) => state.currentNote);
  const searchResults = useNoteStore((state) => state.searchResults);
  const notes = useNoteStore((state) => state.notes);
  const stickyNotes = useStickyNotesStore((state) => state.stickyNotes);
  const { createNote, createFolder, exportCurrentNote, search, clearSearch } =
    useNoteStore();
  const { openTab, switchTab } = useTabStore();

  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const setSelectedStickyNoteId = useUIStore(
    (state) => state.setSelectedStickyNoteId
  );
  const commandPaletteOpen = useUIStore((state) => state.commandPaletteOpen);
  const {
    setCommandPaletteOpen,
    toggleFocusMode,
    setView,
    setSettingsModalOpen,
  } = useUIStore();
  const { createStickyNote } = useStickyNotesStore();

  const [inputValue, setInputValue] = useState("");
  const searchTimeoutRef = useRef<number | null>(null);

  // Detect mode: '>' prefix = command mode, otherwise = search mode
  const isCommandMode = inputValue.trim().startsWith(">");
  const searchQuery = isCommandMode
    ? inputValue.slice(1).trim()
    : inputValue.trim();
  const shouldShowCommands =
    isCommandMode || searchQuery.length < SEARCH_THRESHOLD;
  const shouldSearch = !isCommandMode && searchQuery.length >= SEARCH_THRESHOLD;

  // Get recent items (top 5 most recently updated notes/bookmarks)
  const recentItems = useMemo(() => {
    const recentNotes = [...notes]
      .sort((a, b) => b.updated_at - a.updated_at)
      .slice(0, 5)
      .map((note) => ({
        type: "note" as const,
        id: note.id,
        title: note.title,
        updated_at: note.updated_at,
      }));

    const recentBookmarks = [...bookmarks]
      .sort((a, b) => b.updated_at - a.updated_at)
      .slice(0, 3)
      .map((bookmark) => ({
        type: "bookmark" as const,
        id: bookmark.id,
        title: bookmark.title,
        updated_at: bookmark.updated_at,
      }));

    const recentStickyNotes = [...stickyNotes]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3)
      .map((stickyNote) => ({
        type: "sticky_note" as const,
        id: stickyNote.id,
        title: stickyNote.content,
        updated_at: stickyNote.updatedAt,
      }));

    const allRecent = [...recentNotes, ...recentBookmarks, ...recentStickyNotes]
      .sort((a, b) => b.updated_at - a.updated_at)
      .slice(0, 5);

    return allRecent;
  }, [notes, bookmarks, stickyNotes]);

  // Group search results by type
  const groupedSearchResults = useMemo(() => {
    const groups: {
      note: SearchResult[];
      sticky_note: SearchResult[];
      bookmark: SearchResult[];
    } = {
      note: [],
      sticky_note: [],
      bookmark: [],
    };

    searchResults.forEach((result) => {
      if (groups[result.type as keyof typeof groups]) {
        groups[result.type as keyof typeof groups].push(result);
      }
    });

    return groups;
  }, [searchResults]);

  useEffect(() => {
    if (!commandPaletteOpen) {
      setInputValue("");
      clearSearch();
      // Clear any pending search when palette closes
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    }
  }, [commandPaletteOpen, clearSearch]);

  // Smart search: only search when threshold is met and not in command mode
  useEffect(() => {
    // Clear any pending search
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    // If in command mode, always clear search results
    if (isCommandMode) {
      clearSearch();
      return;
    }

    if (shouldSearch) {
      // Debounce search - wait 300ms after user stops typing
      searchTimeoutRef.current = window.setTimeout(() => {
        search(searchQuery);
        searchTimeoutRef.current = null;
      }, 300);
    } else {
      // Clear search immediately if input is empty or below threshold
      clearSearch();
    }

    // Cleanup timeout on unmount or when input changes
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [isCommandMode, shouldSearch, searchQuery, search, clearSearch]);

  // Create a new note and open it immediately
  const handleCreateNote = useCallback(async () => {
    const note = await createNote("Untitled");
    if (note) {
      await openTab(note.id);
    }
    setCommandPaletteOpen(false);
  }, [createNote, openTab, setCommandPaletteOpen]);

  const handleSelect = useCallback(
    async (action: string) => {
      try {
        switch (action) {
          case "new-note":
            await handleCreateNote();
            break;
          case "new-sticky-note":
            await createStickyNote();
            setView(UIView.StickyNotes);
            setCommandPaletteOpen(false);
            break;
          case "focus-mode":
            toggleFocusMode();
            setCommandPaletteOpen(false);
            break;
          case "export":
            if (currentNote) {
              const filePath = await save({
                defaultPath: `${currentNote.title || "untitled"}.md`,
                filters: [{ name: "Markdown", extensions: ["md"] }],
              });
              if (filePath) {
                await exportCurrentNote(filePath);
              }
            }
            setCommandPaletteOpen(false);
            break;
          case "new-folder":
            if (searchQuery.trim()) {
              await createFolder(searchQuery.trim());
              setCommandPaletteOpen(false);
            }
            break;
          case "settings":
            setSettingsModalOpen(true);
            setCommandPaletteOpen(false);
            break;
          case "open-bookmarks":
            setView(UIView.Bookmarks);
            setCommandPaletteOpen(false);
            break;
          case "open-sticky-notes":
            setView(UIView.StickyNotes);
            setCommandPaletteOpen(false);
            break;
          default:
            if (action.startsWith("note:")) {
              const noteId = action.replace("note:", "");
              setView(UIView.None);
              await openTab(noteId);
              setCommandPaletteOpen(false);
            }
            if (action.startsWith("search-note:")) {
              const noteId = action.replace("search-note:", "");
              setView(UIView.None);
              await openTab(noteId);
              setCommandPaletteOpen(false);
            }
            if (action.startsWith("search-sticky:")) {
              const stickyNoteId = action.replace("search-sticky:", "");
              setSelectedStickyNoteId(stickyNoteId);
              // Navigate to sticky notes view
              setView(UIView.StickyNotes);
              setCommandPaletteOpen(false);
            }
            if (action.startsWith("search-bookmark:")) {
              const bookmarkId = action.replace("search-bookmark:", "");
              const bookmark = searchResults.find((r) => r.id === bookmarkId);
              if (bookmark) {
                // Open bookmark URL in browser
                const { openUrl } = await import("@tauri-apps/plugin-opener");
                await openUrl(bookmark.snippet.replace(/<\/?mark>/g, ""));
              }
              setCommandPaletteOpen(false);
            }
            if (action.startsWith("recent-note:")) {
              const noteId = action.replace("recent-note:", "");
              setView(UIView.None);
              await openTab(noteId);
              setCommandPaletteOpen(false);
            }
            if (action.startsWith("switch-tab:")) {
              const tabId = action.replace("switch-tab:", "");
              switchTab(tabId);
              setCommandPaletteOpen(false);
            }
            if (action.startsWith("recent-sticky-note:")) {
              const stickyNoteId = action.replace("recent-sticky-note:", "");
              setSelectedStickyNoteId(stickyNoteId);
              setView(UIView.StickyNotes);
              setCommandPaletteOpen(false);
            }
            if (action.startsWith("recent-bookmark:")) {
              const bookmarkId = action.replace("recent-bookmark:", "");
              const bookmark = bookmarks.find((b) => b.id === bookmarkId);
              if (bookmark) {
                const { openBookmark, updateBookmark, loadBookmarks } =
                  useBookmarkStore.getState();
                // Update bookmark timestamp by updating title to itself (no-op update that updates timestamp)
                await updateBookmark(bookmarkId, { title: bookmark.title });
                // Reload bookmarks to get fresh timestamp
                await loadBookmarks(bookmark.folder_id ?? null);
                await openBookmark(bookmark.url);
              }
              setCommandPaletteOpen(false);
            }
            break;
        }
      } catch (error) {
        console.error("Command failed:", error);
        toast.error(
          `Operation failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        // Don't close palette on error so user can retry
      }
    },
    [
      handleCreateNote,
      currentNote,
      setCommandPaletteOpen,
      toggleFocusMode,
      exportCurrentNote,
      createFolder,
      openTab,
      switchTab,
      searchQuery,
      createStickyNote,
      setView,
      searchResults,
      bookmarks,
    ]
  );

  if (!commandPaletteOpen) return null;

  // Determine placeholder based on mode
  const placeholder = isCommandMode
    ? "Type a command..."
    : shouldShowCommands
    ? "Search notes or type '>' for commands..."
    : "Search notes, bookmarks, and sticky notes...";

  // Check if we have any results to show
  // Never show search results in command mode
  const hasSearchResults = !isCommandMode && searchResults.length > 0;
  const hasRecentItems =
    recentItems.length > 0 && !shouldSearch && !isCommandMode;

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-24 bg-foreground/20 backdrop-blur-sm z-50"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <Command
        className="w-full max-w-[520px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setCommandPaletteOpen(false);
          }
        }}
        filter={(value, search) => {
          // In command mode, filter using searchQuery (without the ">")
          if (isCommandMode) {
            const query = searchQuery.toLowerCase();
            if (!query) return 1; // Show all if no query
            return value.toLowerCase().includes(query) ? 1 : 0;
          }
          // Default filtering for search mode
          if (!search) return 1;
          return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
        }}
      >
        <Command.Input
          value={inputValue}
          onValueChange={setInputValue}
          placeholder={placeholder}
          className="w-full px-5 py-4 text-[15px] bg-transparent border-b border-border text-foreground placeholder:text-muted-foreground outline-none"
          autoFocus
        />
        <Command.List className="max-h-[360px] overflow-y-auto p-2">
          <EmptyStates
            shouldSearch={shouldSearch}
            hasSearchResults={hasSearchResults}
            searchQuery={searchQuery}
            isCommandMode={isCommandMode}
            shouldShowCommands={shouldShowCommands}
            searchThreshold={SEARCH_THRESHOLD}
          />

          {hasRecentItems && !hasSearchResults && (
            <RecentItems items={recentItems} onSelect={handleSelect} />
          )}

          {shouldShowCommands && !hasSearchResults && (
            <CommandGroups currentNote={currentNote} onSelect={handleSelect} />
          )}

          {hasSearchResults && (
            <SearchResults
              groupedResults={groupedSearchResults}
              onSelect={handleSelect}
            />
          )}
        </Command.List>
      </Command>
    </div>
  );
}
