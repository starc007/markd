import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { Editor } from "../editor/Editor";
import { CommandPalette } from "../command-palette/CommandPalette";
import { useNoteStore } from "../../stores/noteStore";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

export function AppShell() {
  const { currentNote, ui, isLoading } = useNoteStore();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className={`app-shell ${ui.focusMode ? "focus-mode" : ""}`}>
      <TitleBar />

      <div className="app-content">
        <Sidebar />

        <main className="main-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          ) : currentNote ? (
            <Editor
              key={currentNote.id}
              noteId={currentNote.id}
              content={currentNote.content}
            />
          ) : (
            <div className="empty-editor-state">
              <div className="empty-editor-content">
                <svg
                  className="empty-editor-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                <h2>No note selected</h2>
                <p>Select a note from the sidebar or create a new one</p>
                <div className="empty-editor-shortcuts">
                  <kbd>⌘</kbd> + <kbd>N</kbd> to create a new note
                  <br />
                  <kbd>⌘</kbd> + <kbd>K</kbd> to open command palette
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
