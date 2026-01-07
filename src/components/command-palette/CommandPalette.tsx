import { Command } from "cmdk";
import { useEffect, useState, useCallback } from "react";
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
    toggleSidebar,
    exportCurrentNote,
    search,
    searchResults,
    clearSearch,
  } = useNoteStore();

  const [inputValue, setInputValue] = useState("");
  const [mode, setMode] = useState<"commands" | "search" | "notes" | "create">(
    "commands"
  );

  useEffect(() => {
    if (!ui.commandPaletteOpen) {
      setInputValue("");
      setMode("commands");
      clearSearch();
    }
  }, [ui.commandPaletteOpen]);

  useEffect(() => {
    if (mode === "search" && inputValue) {
      search(inputValue);
    }
  }, [inputValue, mode]);

  const handleSelect = useCallback(
    async (action: string) => {
      switch (action) {
        case "new-note":
          if (inputValue.trim()) {
            await createNote(inputValue.trim());
            setCommandPaletteOpen(false);
          } else {
            setMode("create");
            setInputValue("");
          }
          break;
        case "search":
          setMode("search");
          setInputValue("");
          break;
        case "notes":
          setMode("notes");
          setInputValue("");
          break;
        case "toggle-sidebar":
          toggleSidebar();
          setCommandPaletteOpen(false);
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
    [inputValue, currentNote]
  );

  const handleCreateNote = async () => {
    if (inputValue.trim()) {
      await createNote(inputValue.trim());
      setCommandPaletteOpen(false);
    }
  };

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
            } else {
              setCommandPaletteOpen(false);
            }
          }
          if (e.key === "Enter" && mode === "create" && inputValue.trim()) {
            handleCreateNote();
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
              : mode === "notes"
              ? "Go to note..."
              : "Enter note title..."
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
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-[18px] h-[18px] opacity-50"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
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
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-[18px] h-[18px] opacity-50"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
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
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-[18px] h-[18px] opacity-50"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="flex-1 font-medium">Go to Note</span>
                  <kbd className="text-[11px] font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    ⌘O
                  </kbd>
                </Command.Item>
              </Command.Group>

              <Command.Group heading="View">
                <Command.Item
                  value="toggle-sidebar"
                  onSelect={() => handleSelect("toggle-sidebar")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-[18px] h-[18px] opacity-50"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="flex-1 font-medium">Toggle Sidebar</span>
                  <kbd className="text-[11px] font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    ⌘\
                  </kbd>
                </Command.Item>
                <Command.Item
                  value="focus-mode"
                  onSelect={() => handleSelect("focus-mode")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-[18px] h-[18px] opacity-50"
                  >
                    <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" />
                  </svg>
                  <span className="flex-1 font-medium">Focus Mode</span>
                  <kbd className="text-[11px] font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    ⌘⇧F
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
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-[18px] h-[18px] opacity-50"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="flex-1 font-medium">Export Note</span>
                  </Command.Item>
                  <Command.Item
                    value="delete-note"
                    onSelect={() => handleSelect("delete-note")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-destructive data-[selected=true]:bg-destructive/10"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-[18px] h-[18px] opacity-70"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
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
              {searchResults.map((result) => (
                <Command.Item
                  key={result.id}
                  value={`search:${result.id}`}
                  onSelect={() => handleSelect(`search:${result.id}`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-[18px] h-[18px] opacity-50 shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
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

          {mode === "notes" && (
            <Command.Group heading="Notes">
              {notes.map((note) => (
                <Command.Item
                  key={note.id}
                  value={`note:${note.id} ${note.title}`}
                  onSelect={() => handleSelect(`note:${note.id}`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-[18px] h-[18px] opacity-50"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="flex-1 font-medium truncate">
                    {note.title || "Untitled"}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {mode === "create" && (
            <Command.Group heading="Create Note">
              <Command.Item
                value="create-confirm"
                onSelect={handleCreateNote}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-[18px] h-[18px] opacity-50"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="flex-1 font-medium">
                  Create "{inputValue || "Untitled"}"
                </span>
                <kbd className="text-[11px] font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                  ↵
                </kbd>
              </Command.Item>
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
