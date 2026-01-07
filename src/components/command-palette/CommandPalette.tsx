import { Command } from "cmdk";
import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  MagnifyingGlass,
  ClipboardText,
  ArrowsOut,
  Export,
  Trash,
  FileText,
} from "@phosphor-icons/react";
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
    deleteNote,
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

  // Trigger search when input changes in search mode
  useEffect(() => {
    if (mode === "search") {
      if (inputValue.trim()) {
        search(inputValue);
      } else {
        clearSearch();
      }
    }
  }, [inputValue, mode, search, clearSearch]);

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
        case "search":
          setMode("search");
          setInputValue("");
          break;
        case "notes":
          setMode("notes");
          setInputValue("");
          break;
        case "focus-mode":
          toggleFocusMode();
          setCommandPaletteOpen(false);
          break;
        case "delete-note":
          if (currentNote) {
            await deleteNote(currentNote.id);
          }
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
      deleteNote,
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
            if (mode !== "commands") {
              setMode("commands");
              setInputValue("");
              clearSearch();
            } else {
              setCommandPaletteOpen(false);
            }
          }
        }}
      >
        <Command.Input
          value={inputValue}
          onValueChange={setInputValue}
          placeholder={
            mode === "commands"
              ? "Type a command or search..."
              : mode === "search"
              ? "Search notes..."
              : "Go to note..."
          }
          className="w-full px-5 py-4 text-[15px] bg-transparent border-b border-border text-foreground placeholder:text-muted-foreground outline-none"
          autoFocus
        />
        <Command.List className="max-h-[360px] overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-[13px] text-muted-foreground">
            {mode === "search" ? "No results found" : "No results"}
          </Command.Empty>

          {mode === "commands" && (
            <>
              <Command.Group heading="Actions">
                <Command.Item
                  value="new-note"
                  onSelect={() => handleSelect("new-note")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
                >
                  <Plus className="w-[18px] h-[18px] opacity-50" />
                  <span className="flex-1 font-medium">New Note</span>
                  <kbd className="text-[11px] font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    ⌘N
                  </kbd>
                </Command.Item>
                <Command.Item
                  value="search"
                  onSelect={() => handleSelect("search")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
                >
                  <MagnifyingGlass className="w-[18px] h-[18px] opacity-50" />
                  <span className="flex-1 font-medium">Search Notes</span>
                  <kbd className="text-[11px] font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    ⌘P
                  </kbd>
                </Command.Item>
                <Command.Item
                  value="notes"
                  onSelect={() => handleSelect("notes")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
                >
                  <ClipboardText className="w-[18px] h-[18px] opacity-50" />
                  <span className="flex-1 font-medium">Go to Note</span>
                  <kbd className="text-[11px] font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    ⌘O
                  </kbd>
                </Command.Item>
              </Command.Group>

              <Command.Group heading="View">
                <Command.Item
                  value="focus-mode"
                  onSelect={() => handleSelect("focus-mode")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
                >
                  <ArrowsOut className="w-[18px] h-[18px] opacity-50" />
                  <span className="flex-1 font-medium">Toggle Sidebar</span>
                  <kbd className="text-[11px] font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    ⌘\
                  </kbd>
                </Command.Item>
              </Command.Group>

              {currentNote && (
                <Command.Group heading="Current Note">
                  <Command.Item
                    value="export"
                    onSelect={() => handleSelect("export")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
                  >
                    <Export className="w-[18px] h-[18px] opacity-50" />
                    <span className="flex-1 font-medium">Export Note</span>
                  </Command.Item>
                  <Command.Item
                    value="delete-note"
                    onSelect={() => handleSelect("delete-note")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-destructive data-[selected=true]:bg-destructive/10"
                  >
                    <Trash className="w-[18px] h-[18px] opacity-70" />
                    <span className="flex-1 font-medium">Delete Note</span>
                    <kbd className="text-[11px] font-mono font-medium text-destructive/70 bg-destructive/10 px-2 py-0.5 rounded">
                      ⌘⌫
                    </kbd>
                  </Command.Item>
                </Command.Group>
              )}
            </>
          )}

          {mode === "search" && (
            <Command.Group heading="Search Results">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <Command.Item
                    key={result.id}
                    value={`search:${result.id} ${result.title}`}
                    onSelect={() => handleSelect(`search:${result.id}`)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
                  >
                    <FileText className="w-[18px] h-[18px] opacity-50 shrink-0" />
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
                ))
              ) : inputValue.trim() ? (
                <div className="py-6 text-center text-[13px] text-muted-foreground">
                  No notes found for "{inputValue}"
                </div>
              ) : (
                <div className="py-6 text-center text-[13px] text-muted-foreground">
                  Type to search notes...
                </div>
              )}
            </Command.Group>
          )}

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
                    <FileText className="w-[18px] h-[18px] opacity-50" />
                    <span className="flex-1 font-medium truncate">
                      {note.title || "Untitled"}
                    </span>
                  </Command.Item>
                ))
              ) : (
                <div className="py-6 text-center text-[13px] text-muted-foreground">
                  No notes yet. Create one with ⌘N
                </div>
              )}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
