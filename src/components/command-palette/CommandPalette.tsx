import { Command } from "cmdk";
import { useEffect, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AddIcon,
  ClipboardIcon,
  MaximizeIcon,
  Download01Icon,
  FileEditIcon,
  CommandIcon,
} from "@hugeicons/core-free-icons";
import { useNoteStore } from "../../stores/noteStore";
import { save } from "@tauri-apps/plugin-dialog";

export function CommandPalette() {
  const {
    ui,
    notes,
    currentNote,
    setCommandPaletteOpen,
    loadNote,
    createNote,
    createFolder,
    toggleFocusMode,
    exportCurrentNote,
    search,
    searchResults,
    clearSearch,
  } = useNoteStore();

  const [inputValue, setInputValue] = useState("");
  const [mode, setMode] = useState<"commands" | "search" | "notes">("commands");

  useEffect(() => {
    if (!ui.commandPaletteOpen) {
      setInputValue("");
      setMode("commands");
      clearSearch();
    }
  }, [ui.commandPaletteOpen, clearSearch]);

  // Unified search: show both filtered commands and search results (like Spotlight)
  useEffect(() => {
    if (inputValue.trim()) {
      // Always search notes when typing
      search(inputValue);
    } else {
      clearSearch();
    }
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
      switch (action) {
        case "new-note":
          await handleCreateNote();
          break;
        case "notes":
          setMode("notes");
          setInputValue("");
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
        default:
          if (action.startsWith("note:")) {
            const noteId = action.replace("note:", "");
            await loadNote(noteId);
            setCommandPaletteOpen(false);
          }
          if (action.startsWith("search:")) {
            const noteId = action.replace("search:", "");
            await loadNote(noteId);
            setCommandPaletteOpen(false);
          }
          break;
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
    ]
  );

  if (!ui.commandPaletteOpen) return null;

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
            if (mode === "notes") {
              setMode("commands");
              setInputValue("");
            } else {
              setCommandPaletteOpen(false);
            }
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
              value="go to note"
              onSelect={() => handleSelect("notes")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
            >
              <HugeiconsIcon
                icon={ClipboardIcon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
                className="opacity-50"
              />
              <span className="flex-1 font-medium">Go to Note</span>
              <kbd className="flex items-center gap-1 text-sm font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                <HugeiconsIcon
                  icon={CommandIcon}
                  size={17}
                  color="currentColor"
                  strokeWidth={1.5}
                />
                <span>O</span>
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
          </Command.Group>

          {/* Search Results - shown when there are results */}
          {inputValue.trim() && searchResults.length > 0 && (
            <Command.Group heading="Search Results">
              {searchResults.map((result) => (
                <Command.Item
                  key={result.id}
                  value={`search:${result.id} ${result.title}`}
                  onSelect={() => handleSelect(`search:${result.id}`)}
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
                    <div className="font-medium truncate">{result.title}</div>
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

          {/* Notes mode - when "Go to Note" is selected */}
          {mode === "notes" && (
            <Command.Group heading="Notes">
              {notes.length > 0 ? (
                notes.map((note) => (
                  <Command.Item
                    key={note.id}
                    value={`note:${note.id} ${note.title}`}
                    onSelect={() => handleSelect(`note:${note.id}`)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
                  >
                    <HugeiconsIcon
                      icon={FileEditIcon}
                      size={18}
                      color="currentColor"
                      strokeWidth={1.5}
                      className="opacity-50"
                    />
                    <span className="flex-1 font-medium truncate">
                      {note.title || "Untitled"}
                    </span>
                  </Command.Item>
                ))
              ) : (
                <div className="py-6 text-center text-[13px] text-muted-foreground">
                  No notes yet. Create one with{" "}
                  <span className="inline-flex items-center gap-1">
                    <HugeiconsIcon
                      icon={CommandIcon}
                      size={12}
                      color="currentColor"
                      strokeWidth={1.5}
                    />
                    <span>N</span>
                  </span>
                </div>
              )}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
