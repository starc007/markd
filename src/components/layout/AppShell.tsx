import { Sidebar } from "./Sidebar";
import { Editor } from "../editor/Editor";
import { CommandPalette } from "../command-palette/CommandPalette";
import { TitleBar } from "./TitleBar";
import { NotesGrid } from "../notes/NotesGrid";
import { SettingsModal } from "../settings/SettingsModal";
import { Bookmarks } from "../bookmarks/Bookmarks";
import { SectionErrorBoundary } from "../SectionErrorBoundary";
import { useNoteStore } from "../../stores/noteStore";
import { useUIStore, UIView } from "../../stores/uiStore";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useTheme } from "../../hooks/useTheme";
import { useWindowFocus } from "../../hooks/useWindowFocus";
import { useAppStateRestore } from "../../hooks/useAppStateRestore";
import { useUpdateCheck } from "../../hooks/useUpdateCheck";
import Welcome from "../welcome";

export function AppShell() {
  // Use selective subscriptions to prevent unnecessary re-renders
  const currentNote = useNoteStore((state) => state.currentNote);
  const currentView = useUIStore((state) => state.currentView);
  const focusMode = useUIStore((state) => state.focusMode);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const settingsModalOpen = useUIStore((state) => state.settingsModalOpen);
  const setSettingsModalOpen = useUIStore(
    (state) => state.setSettingsModalOpen
  );

  useKeyboardShortcuts();
  useTheme(); // Apply theme
  useWindowFocus(); // Refresh data on window focus
  useUpdateCheck(); // Check for updates on app startup and periodically
  useAppStateRestore(); // Restore app state (current note, view, etc.) on startup

  const renderContent = () => {
    if (currentView === UIView.StickyNotes) {
      return <NotesGrid />;
    } else if (currentView === UIView.Bookmarks) {
      return <Bookmarks />;
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
        {!sidebarCollapsed && !focusMode && (
          <SectionErrorBoundary section="sidebar">
            <Sidebar />
          </SectionErrorBoundary>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden w-full">
          <SectionErrorBoundary
            section={
              currentView === UIView.StickyNotes ? "notes-grid" : "editor"
            }
          >
            {renderContent()}
          </SectionErrorBoundary>
        </main>
      </div>

      {/* Command Palette - still accessible in focus mode */}
      <SectionErrorBoundary section="command-palette">
        <CommandPalette />
      </SectionErrorBoundary>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}
