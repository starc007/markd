import { Sidebar } from "./Sidebar";
import { Editor } from "../editor/Editor";
import { CommandPalette } from "../command-palette/CommandPalette";
import { TitleBar } from "./TitleBar";
import { NotesGrid } from "../notes/NotesGrid";
import { Settings } from "../settings/Settings";
import { useNoteStore } from "../../stores/noteStore";
import { useUIStore, UIView } from "../../stores/uiStore";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useTheme } from "../../hooks/useTheme";
import { useWindowFocus } from "../../hooks/useWindowFocus";
import Welcome from "../welcome";

export function AppShell() {
  // Use selective subscriptions to prevent unnecessary re-renders
  const currentNote = useNoteStore((state) => state.currentNote);
  const currentView = useUIStore((state) => state.currentView);
  const focusMode = useUIStore((state) => state.focusMode);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);

  useKeyboardShortcuts();
  useTheme(); // Apply theme
  useWindowFocus(); // Refresh data on window focus

  console.log("currentNote", currentNote);
  console.log("currentView", currentView);
  console.log("focusMode", focusMode);
  console.log("sidebarCollapsed", sidebarCollapsed);

  const renderContent = () => {
    if (currentView === UIView.Settings) {
      return <Settings />;
    } else if (currentView === UIView.StickyNotes) {
      return <NotesGrid />;
    } else if (currentNote) {
      return (
        <Editor
          key={currentNote.id}
          noteId={currentNote.id}
          content={currentNote.content}
        />
      );
    } else {
      return <Welcome />;
    }
  };

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden bg-background ${
        focusMode ? "focus-mode" : ""
      }`}
    >
      {/* Title Bar with drag region - hidden in focus mode */}
      {!focusMode && <TitleBar />}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - hidden in focus mode or when collapsed */}
        {!sidebarCollapsed && !focusMode && <Sidebar />}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {renderContent()}
        </main>
      </div>

      {/* Command Palette - still accessible in focus mode */}
      <CommandPalette />
    </div>
  );
}
