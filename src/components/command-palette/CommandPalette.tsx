import { Command } from "cmdk";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AddIcon,
  MaximizeIcon,
  Download01Icon,
  FileEditIcon,
  CommandIcon,
  SettingsIcon,
  StickyNoteIcon,
  LinkIcon,
  Bookmark01Icon,
} from "@hugeicons/core-free-icons";
import { useNoteStore } from "../../stores/noteStore";
import { useUIStore, UIView } from "../../stores/uiStore";
import { useStickyNotesStore } from "../../stores/stickyNotesStore";
import { useBookmarkStore } from "../../stores/bookmarkStore";
import { save } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";

const searchResultColors = {
  note: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  sticky_note:
    "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20",
  bookmark:
    "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20",
};

const SEARCH_THRESHOLD = 2; // Only search after 2+ characters

export function CommandPalette() {
  const currentNote = useNoteStore((state) => state.currentNote);
  const searchResults = useNoteStore((state) => state.searchResults);
  const notes = useNoteStore((state) => state.notes);
  const {
    loadNote,
    createNote,
    createFolder,
    exportCurrentNote,
    search,
    clearSearch,
  } = useNoteStore();

  const bookmarks = useBookmarkStore((state) => state.bookmarks);

  const commandPaletteOpen = useUIStore((state) => state.commandPaletteOpen);
  const { setCommandPaletteOpen, toggleFocusMode, setView } = useUIStore();
  const { createStickyNote } = useStickyNotesStore();

  const [inputValue, setInputValue] = useState("");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
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
  // Prioritize currentNote to appear first
  const recentItems = useMemo(() => {
    const recentNotes = [...notes]
      .sort((a, b) => {
        // Prioritize current note
        if (a.id === currentNote?.id) return -1;
        if (b.id === currentNote?.id) return 1;
        return b.updated_at - a.updated_at;
      })
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

    const allRecent = [...recentNotes, ...recentBookmarks]
      .sort((a, b) => {
        // Prioritize current note
        if (a.type === "note" && a.id === currentNote?.id) return -1;
        if (b.type === "note" && b.id === currentNote?.id) return 1;
        return b.updated_at - a.updated_at;
      })
      .slice(0, 5);

    return allRecent;
  }, [notes, bookmarks, currentNote]);

  // Group search results by type
  const groupedSearchResults = useMemo(() => {
    const groups: Record<string, typeof searchResults> = {
      note: [],
      sticky_note: [],
      bookmark: [],
    };

    searchResults.forEach((result) => {
      if (groups[result.type]) {
        groups[result.type].push(result);
      }
    });

    return groups;
  }, [searchResults]);

  useEffect(() => {
    if (!commandPaletteOpen) {
      setInputValue("");
      clearSearch();
      setHoveredItem(null);
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
      await loadNote(note.id);
    }
    setCommandPaletteOpen(false);
  }, [createNote, loadNote, setCommandPaletteOpen]);

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
            setView(UIView.Settings);
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
              await loadNote(noteId);
              setCommandPaletteOpen(false);
            }
            if (action.startsWith("search-note:")) {
              const noteId = action.replace("search-note:", "");
              setView(UIView.None);
              await loadNote(noteId);
              setCommandPaletteOpen(false);
            }
            if (action.startsWith("search-sticky:")) {
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
              await loadNote(noteId);
              setCommandPaletteOpen(false);
            }
            if (action.startsWith("recent-bookmark:")) {
              const bookmarkId = action.replace("recent-bookmark:", "");
              const bookmark = bookmarks.find((b) => b.id === bookmarkId);
              if (bookmark) {
                const { openBookmark } = useBookmarkStore.getState();
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
      loadNote,
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
          {/* Empty State - No search results */}
          {shouldSearch &&
            !hasSearchResults &&
            searchQuery.length >= SEARCH_THRESHOLD && (
              <Command.Empty className="py-8 text-center">
                <p className="text-[13px] text-muted-foreground mb-2">
                  No results found for "{searchQuery}"
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                  Try a different search term or type{" "}
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                    {">"}
                  </kbd>{" "}
                  for commands
                </p>
              </Command.Empty>
            )}

          {/* Empty State - Command mode with no matches */}
          {isCommandMode &&
            searchQuery.length > 0 &&
            shouldShowCommands &&
            !hasSearchResults && (
              <Command.Empty className="py-8 text-center">
                <p className="text-[13px] text-muted-foreground mb-2">
                  No commands match "{searchQuery}"
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                  Remove{" "}
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                    {">"}
                  </kbd>{" "}
                  to search content
                </p>
              </Command.Empty>
            )}

          {/* Recent Items - shown when input is empty or very short */}
          {hasRecentItems && !hasSearchResults && (
            <Command.Group heading="Recent">
              {recentItems.map((item) => {
                const isBookmark = item.type === "bookmark";
                const icon = isBookmark ? Bookmark01Icon : FileEditIcon;
                const actionPrefix = isBookmark
                  ? "recent-bookmark:"
                  : "recent-note:";

                return (
                  <Command.Item
                    key={`${item.type}-${item.id}`}
                    value={`${actionPrefix}${item.id} ${item.title}`}
                    onSelect={() => handleSelect(`${actionPrefix}${item.id}`)}
                    onMouseEnter={() =>
                      setHoveredItem(`${actionPrefix}${item.id}`)
                    }
                    onMouseLeave={() => setHoveredItem(null)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
                  >
                    <HugeiconsIcon
                      icon={icon}
                      size={18}
                      color="currentColor"
                      strokeWidth={1.5}
                      className="opacity-50 shrink-0"
                    />
                    <span className="flex-1 font-medium truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 shrink-0">
                      Recent
                    </span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          )}

          {/* Commands - shown when in command mode or when input is empty/short */}
          {shouldShowCommands && !hasSearchResults && (
            <>
              {/* Create Category */}
              <Command.Group heading="Create">
                <Command.Item
                  value="new note"
                  onSelect={() => handleSelect("new-note")}
                  onMouseEnter={() => setHoveredItem("new-note")}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
                >
                  <HugeiconsIcon
                    icon={AddIcon}
                    size={18}
                    color="currentColor"
                    strokeWidth={1.5}
                    className="opacity-50"
                  />
                  <span className="flex-1 font-medium">New Note</span>
                  {hoveredItem === "new-note" && (
                    <kbd className="flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                      <HugeiconsIcon
                        icon={CommandIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                      <span>N</span>
                    </kbd>
                  )}
                </Command.Item>
                <Command.Item
                  value="new sticky note"
                  onSelect={() => handleSelect("new-sticky-note")}
                  onMouseEnter={() => setHoveredItem("new-sticky-note")}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
                >
                  <HugeiconsIcon
                    icon={AddIcon}
                    size={18}
                    color="currentColor"
                    strokeWidth={1.5}
                    className="opacity-50"
                  />
                  <span className="flex-1 font-medium">New Sticky Note</span>
                  {hoveredItem === "new-sticky-note" && (
                    <kbd className="flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                      <HugeiconsIcon
                        icon={CommandIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                      <span>+</span>
                      <span>Shift</span>
                      <span>+</span>
                      <span>N</span>
                    </kbd>
                  )}
                </Command.Item>
              </Command.Group>

              {/* Navigate Category */}
              <Command.Group heading="Navigate">
                <Command.Item
                  value="open sticky notes"
                  onSelect={() => handleSelect("open-sticky-notes")}
                  onMouseEnter={() => setHoveredItem("open-sticky-notes")}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
                >
                  <HugeiconsIcon
                    icon={StickyNoteIcon}
                    size={18}
                    color="currentColor"
                    strokeWidth={1.5}
                    className="opacity-50"
                  />
                  <span className="flex-1 font-medium">Open Sticky Notes</span>
                  {hoveredItem === "open-sticky-notes" && (
                    <kbd className="flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                      <HugeiconsIcon
                        icon={CommandIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                      <span>+</span>
                      <span>Shift</span>
                      <span>+</span>
                      <span>O</span>
                    </kbd>
                  )}
                </Command.Item>
                <Command.Item
                  value="open bookmarks"
                  onSelect={() => handleSelect("open-bookmarks")}
                  onMouseEnter={() => setHoveredItem("open-bookmarks")}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
                >
                  <HugeiconsIcon
                    icon={Bookmark01Icon}
                    size={18}
                    color="currentColor"
                    strokeWidth={1.5}
                    className="opacity-50"
                  />
                  <span className="flex-1 font-medium">Open Bookmarks</span>
                  {hoveredItem === "open-bookmarks" && (
                    <kbd className="flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                      <HugeiconsIcon
                        icon={CommandIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                      <span>+</span>
                      <span>Shift</span>
                      <span>+</span>
                      <span>B</span>
                    </kbd>
                  )}
                </Command.Item>
              </Command.Group>

              {/* Actions Category */}
              <Command.Group heading="Actions">
                <Command.Item
                  value="toggle sidebar"
                  onSelect={() => handleSelect("focus-mode")}
                  onMouseEnter={() => setHoveredItem("focus-mode")}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
                >
                  <HugeiconsIcon
                    icon={MaximizeIcon}
                    size={18}
                    color="currentColor"
                    strokeWidth={1.5}
                    className="opacity-50"
                  />
                  <span className="flex-1 font-medium">Toggle Sidebar</span>
                  {hoveredItem === "focus-mode" && (
                    <kbd className="flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                      <HugeiconsIcon
                        icon={CommandIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                      <span>\</span>
                    </kbd>
                  )}
                </Command.Item>
                {currentNote && (
                  <Command.Item
                    value="export note"
                    onSelect={() => handleSelect("export")}
                    onMouseEnter={() => setHoveredItem("export")}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
                  >
                    <HugeiconsIcon
                      icon={Download01Icon}
                      size={18}
                      color="currentColor"
                      strokeWidth={1.5}
                      className="opacity-50"
                    />
                    <span className="flex-1 font-medium">Export Note</span>
                  </Command.Item>
                )}
              </Command.Group>

              {/* Settings Category */}
              <Command.Group heading="Settings">
                <Command.Item
                  value="settings"
                  onSelect={() => handleSelect("settings")}
                  onMouseEnter={() => setHoveredItem("settings")}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
                >
                  <HugeiconsIcon
                    icon={SettingsIcon}
                    size={18}
                    color="currentColor"
                    strokeWidth={1.5}
                    className="opacity-50"
                  />
                  <span className="flex-1 font-medium">Settings</span>
                  {hoveredItem === "settings" && (
                    <kbd className="flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                      <HugeiconsIcon
                        icon={CommandIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                      <span>+</span>
                      <span>Shift</span>
                      <span>+</span>
                      <span>T</span>
                    </kbd>
                  )}
                </Command.Item>
              </Command.Group>
            </>
          )}

          {/* Search Results - grouped by type with counts */}
          {hasSearchResults && (
            <>
              {groupedSearchResults.note.length > 0 && (
                <Command.Group
                  heading={`Notes (${groupedSearchResults.note.length})`}
                >
                  {groupedSearchResults.note.map((result) => (
                    <Command.Item
                      key={result.id}
                      value={`search-note:${result.id} ${result.title}`}
                      onSelect={() => handleSelect(`search-note:${result.id}`)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
                    >
                      <HugeiconsIcon
                        icon={FileEditIcon}
                        size={18}
                        color="currentColor"
                        strokeWidth={1.5}
                        className="opacity-50 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate flex items-center justify-between">
                          {result.title}
                          <span
                            className={`ml-2 text-[11px] font-mono px-1.5 py-0.5 rounded ${searchResultColors.note}`}
                          >
                            Note
                          </span>
                        </div>
                        {result.snippet && (
                          <div
                            className="text-[12px] text-muted-foreground truncate mt-0.5"
                            dangerouslySetInnerHTML={{ __html: result.snippet }}
                          />
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {groupedSearchResults.sticky_note.length > 0 && (
                <Command.Group
                  heading={`Sticky Notes (${groupedSearchResults.sticky_note.length})`}
                >
                  {groupedSearchResults.sticky_note.map((result) => (
                    <Command.Item
                      key={result.id}
                      value={`search-sticky:${result.id} ${result.title}`}
                      onSelect={() =>
                        handleSelect(`search-sticky:${result.id}`)
                      }
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
                    >
                      <HugeiconsIcon
                        icon={StickyNoteIcon}
                        size={18}
                        color="currentColor"
                        strokeWidth={1.5}
                        className="opacity-50 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate flex items-center justify-between">
                          {result.title}
                          <span
                            className={`ml-2 text-[11px] font-mono px-1.5 py-0.5 rounded ${searchResultColors.sticky_note}`}
                          >
                            Sticky
                          </span>
                        </div>
                        {result.snippet && (
                          <div
                            className="text-[12px] text-muted-foreground truncate mt-0.5"
                            dangerouslySetInnerHTML={{ __html: result.snippet }}
                          />
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {groupedSearchResults.bookmark.length > 0 && (
                <Command.Group
                  heading={`Bookmarks (${groupedSearchResults.bookmark.length})`}
                >
                  {groupedSearchResults.bookmark.map((result) => (
                    <Command.Item
                      key={result.id}
                      value={`search-bookmark:${result.id} ${result.title}`}
                      onSelect={() =>
                        handleSelect(`search-bookmark:${result.id}`)
                      }
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
                    >
                      <HugeiconsIcon
                        icon={LinkIcon}
                        size={18}
                        color="currentColor"
                        strokeWidth={1.5}
                        className="opacity-50 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate flex items-center justify-between">
                          {result.title}
                          <span
                            className={`ml-2 text-[11px] font-mono px-1.5 py-0.5 rounded ${searchResultColors.bookmark}`}
                          >
                            Bookmark
                          </span>
                        </div>
                        {result.snippet && (
                          <div
                            className="text-[12px] text-muted-foreground truncate mt-0.5"
                            dangerouslySetInnerHTML={{ __html: result.snippet }}
                          />
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
