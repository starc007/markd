import { Sidebar } from "./Sidebar";
import { Editor } from "../editor/Editor";
import { CommandPalette } from "../command-palette/CommandPalette";
import { useNoteStore } from "../../stores/noteStore";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { NotesGrid } from "../notes/NotesGrid";

export function AppShell() {
  const { currentNote, ui } = useNoteStore();

  useKeyboardShortcuts();

  return (
    <div
      className={`flex h-screen overflow-hidden bg-background ${
        ui.focusMode ? "focus-mode" : ""
      }`}
    >
      {/* Sidebar */}
      {!ui.sidebarCollapsed && !ui.focusMode && <Sidebar />}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentNote ? (
          <Editor
            key={currentNote.id}
            noteId={currentNote.id}
            content={currentNote.content}
          />
        ) : (
          <NotesGrid />
        )}
      </main>

      <CommandPalette />
    </div>
  );
}
