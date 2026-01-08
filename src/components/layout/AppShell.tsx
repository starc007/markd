import { Sidebar } from "./Sidebar";
import { Editor } from "../editor/Editor";
import { CommandPalette } from "../command-palette/CommandPalette";
import { TitleBar } from "./TitleBar";
import { NotesGrid } from "../notes/NotesGrid";
import { Settings } from "../settings/Settings";
import { useNoteStore } from "../../stores/noteStore";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useTheme } from "../../hooks/useTheme";

export function AppShell() {
  const { currentNote, ui } = useNoteStore();

  useKeyboardShortcuts();
  useTheme(); // Apply theme

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden bg-background ${
        ui.focusMode ? "focus-mode" : ""
      }`}
    >
      {/* Title Bar with drag region */}
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {!ui.sidebarCollapsed && !ui.focusMode && <Sidebar />}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {ui.showSettings ? (
            <Settings />
          ) : currentNote && !ui.showStickyNotes ? (
            <Editor
              key={currentNote.id}
              noteId={currentNote.id}
              content={currentNote.content}
            />
          ) : (
            <NotesGrid />
          )}
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
