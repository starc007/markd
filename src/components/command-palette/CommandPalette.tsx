import { Command } from "cmdk";
import { useEffect, useState, useCallback, useRef } from "react";
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
import { save } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";

const searchResultColors = {
  note: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  sticky_note:
    "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20",
  bookmark:
    "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20",
};

export function CommandPalette() {
  const currentNote = useNoteStore((state) => state.currentNote);
  const searchResults = useNoteStore((state) => state.searchResults);
  const {
    loadNote,
    createNote,
    createFolder,
    exportCurrentNote,
    search,
    clearSearch,
  } = useNoteStore();

  const commandPaletteOpen = useUIStore((state) => state.commandPaletteOpen);
  const { setCommandPaletteOpen, toggleFocusMode, setView } = useUIStore();
  const { createStickyNote } = useStickyNotesStore();

  const [inputValue, setInputValue] = useState("");
  const searchTimeoutRef = useRef<number | null>(null);

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

  // Unified search: show both filtered commands and search results (like Spotlight)
  // Debounced to avoid excessive searches while typing
  useEffect(() => {
    // Clear any pending search
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    if (inputValue.trim()) {
      // Debounce search - wait 300ms after user stops typing
      searchTimeoutRef.current = window.setTimeout(() => {
        search(inputValue);
        searchTimeoutRef.current = null;
      }, 300);
    } else {
      // Clear search immediately if input is empty
      clearSearch();
    }

    // Cleanup timeout on unmount or when input changes
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [inputValue, search, clearSearch]);

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
            if (inputValue.trim()) {
              await createFolder(inputValue.trim());
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
          default:
            if (action.startsWith("note:")) {
              const noteId = action.replace("note:", "");
              await loadNote(noteId);
              setCommandPaletteOpen(false);
            }
            if (action.startsWith("search-note:")) {
              const noteId = action.replace("search-note:", "");
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
      inputValue,
      createStickyNote,
      setView,
    ]
  );

  if (!commandPaletteOpen) return null;

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
      >
        <Command.Input
          value={inputValue}
          onValueChange={setInputValue}
          placeholder="Search notes or commands..."
          className="w-full px-5 py-4 text-[15px] bg-transparent border-b border-border text-foreground placeholder:text-muted-foreground outline-none"
          autoFocus
        />
        <Command.List className="max-h-[360px] overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-[13px] text-muted-foreground">
            No results found
          </Command.Empty>

          {/* Commands - cmdk automatically filters based on value prop */}
          <Command.Group heading="Commands">
            <Command.Item
              value="new note"
              onSelect={() => handleSelect("new-note")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
            >
              <HugeiconsIcon
                icon={AddIcon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
                className="opacity-50"
              />
              <span className="flex-1 font-medium">New Note</span>
              <kbd className="flex items-center gap-1 text-sm font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                <HugeiconsIcon
                  icon={CommandIcon}
                  size={17}
                  color="currentColor"
                  strokeWidth={1.5}
                />
                <span>N</span>
              </kbd>
            </Command.Item>
            <Command.Item
              value="new sticky note"
              onSelect={() => handleSelect("new-sticky-note")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
            >
              <HugeiconsIcon
                icon={AddIcon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
                className="opacity-50"
              />
              <span className="flex-1 font-medium">New Sticky Note</span>
              <kbd className="flex items-center gap-1 text-sm font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                <HugeiconsIcon
                  icon={CommandIcon}
                  size={17}
                  color="currentColor"
                  strokeWidth={1.5}
                />
                <span>+</span>
                <span>Shift</span>
                <span>+</span>
                <span>N</span>
              </kbd>
            </Command.Item>
            <Command.Item
              value="open sticky notes"
              onSelect={() => handleSelect("open-sticky-notes")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
            >
              <HugeiconsIcon
                icon={StickyNoteIcon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
                className="opacity-50"
              />
              <span className="flex-1 font-medium">Open Sticky Notes</span>
              <kbd className="flex items-center gap-1 text-sm font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                <HugeiconsIcon
                  icon={CommandIcon}
                  size={17}
                  color="currentColor"
                  strokeWidth={1.5}
                />
                <span>+</span>
                <span>Shift</span>
                <span>+</span>
                <span>O</span>
              </kbd>
            </Command.Item>
            <Command.Item
              value="open bookmarks"
              onSelect={() => handleSelect("open-bookmarks")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
            >
              <HugeiconsIcon
                icon={Bookmark01Icon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
                className="opacity-50"
              />
              <span className="flex-1 font-medium">Open Bookmarks</span>
              <kbd className="flex items-center gap-1 text-sm font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                <HugeiconsIcon
                  icon={CommandIcon}
                  size={17}
                  color="currentColor"
                  strokeWidth={1.5}
                />
                <span>+</span>
                <span>Shift</span>
                <span>+</span>
                <span>B</span>
              </kbd>
            </Command.Item>

            <Command.Item
              value="toggle sidebar"
              onSelect={() => handleSelect("focus-mode")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
            >
              <HugeiconsIcon
                icon={MaximizeIcon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
                className="opacity-50"
              />
              <span className="flex-1 font-medium">Toggle Sidebar</span>
              <kbd className="flex items-center gap-1 text-sm font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                <HugeiconsIcon
                  icon={CommandIcon}
                  size={17}
                  color="currentColor"
                  strokeWidth={1.5}
                />
                <span>\</span>
              </kbd>
            </Command.Item>
            {currentNote && (
              <Command.Item
                value="export note"
                onSelect={() => handleSelect("export")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
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
            <Command.Item
              value="settings"
              onSelect={() => handleSelect("settings")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
            >
              <HugeiconsIcon
                icon={SettingsIcon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
                className="opacity-50"
              />
              <span className="flex-1 font-medium">Settings</span>
              <kbd className="flex items-center gap-1 text-sm font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                <HugeiconsIcon
                  icon={CommandIcon}
                  size={17}
                  color="currentColor"
                  strokeWidth={1.5}
                />
                <span>+</span>
                <span>Shift</span>
                <span>+</span>
                <span>T</span>
              </kbd>
            </Command.Item>
          </Command.Group>

          {/* Search Results - shown when there are results */}
          {inputValue.trim() && searchResults.length > 0 && (
            <Command.Group heading="Search Results">
              {searchResults.map((result) => {
                const isSticky = result.type === "sticky_note";
                const isBookmark = result.type === "bookmark";
                const isNote = result.type === "note";
                const actionPrefix = isBookmark
                  ? "search-bookmark:"
                  : isSticky
                  ? "search-sticky:"
                  : isNote
                  ? "search-note:"
                  : null;

                const icon = isBookmark
                  ? LinkIcon
                  : isSticky
                  ? StickyNoteIcon
                  : isNote
                  ? FileEditIcon
                  : null;

                const label = isBookmark
                  ? "Bookmark"
                  : isSticky
                  ? "Sticky Note"
                  : isNote
                  ? "Note"
                  : null;

                if (!icon || !actionPrefix) return null;

                return (
                  <Command.Item
                    key={result.id}
                    value={`${actionPrefix}${result.id} ${result.title}`}
                    onSelect={() => handleSelect(`${actionPrefix}${result.id}`)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
                  >
                    <HugeiconsIcon
                      icon={icon}
                      size={18}
                      color="currentColor"
                      strokeWidth={1.5}
                      className="opacity-50 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate flex items-center justify-between">
                        {result.title}
                        {label && (
                          <span
                            className={`ml-2 text-[11px] font-mono px-1 ${
                              searchResultColors[result.type]
                            }`}
                          >
                            {label}
                          </span>
                        )}
                      </div>
                      {result.snippet && (
                        <div
                          className="text-[12px] text-muted-foreground truncate mt-0.5"
                          dangerouslySetInnerHTML={{ __html: result.snippet }}
                        />
                      )}
                    </div>
                  </Command.Item>
                );
              })}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
