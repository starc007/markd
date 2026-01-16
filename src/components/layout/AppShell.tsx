import { Sidebar } from "./Sidebar";
import { Editor } from "../editor/Editor";
import { CommandPalette } from "@/features/command-palette/components/CommandPalette";

import { StickyNotesGrid } from "@/features/sticky-notes/components/StickyNotesGrid";
import { SettingsModal } from "../settings/SettingsModal";
import { Bookmarks } from "@/features/bookmarks/components/Bookmarks";
import { SectionErrorBoundary } from "../SectionErrorBoundary";
import { TabBar } from "../tabs/TabBar";

import { useUIStore, UIView } from "@/stores/uiStore";
import { useTabStore } from "@/stores/tabStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTheme } from "@/hooks/useTheme";
import { useWindowFocus } from "@/hooks/useWindowFocus";
import { useAppStateRestore } from "@/hooks/useAppStateRestore";
import { useUpdateCheck } from "@/hooks/useUpdateCheck";
import Welcome from "@/components/welcome";

export function AppShell() {
  // Use selective subscriptions to prevent unnecessary re-renders
  const currentView = useUIStore((state) => state.currentView);
  const focusMode = useUIStore((state) => state.focusMode);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const settingsModalOpen = useUIStore((state) => state.settingsModalOpen);
  const setSettingsModalOpen = useUIStore(
    (state) => state.setSettingsModalOpen
  );
  const activeTab = useTabStore((state) => state.getActiveTab());
  const openTabs = useTabStore((state) => state.openTabs);

  useKeyboardShortcuts();
  useTheme(); // Apply theme
  useWindowFocus(); // Refresh data on window focus
  useUpdateCheck(); // Check for updates on app startup and periodically
  useAppStateRestore(); // Restore app state (current note, view, etc.) on startup

  const renderContent = () => {
    if (currentView === UIView.StickyNotes) {
      return <StickyNotesGrid />;
    } else if (currentView === UIView.Bookmarks) {
      return <Bookmarks />;
    } else if (activeTab) {
      return (
        <Editor
          key={activeTab.id}
          noteId={activeTab.id}
          content={activeTab.content}
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
      {/* {!focusMode && <TitleBar />} */}

      <div className="flex flex-1 overflow-hidden" data-tauri-drag-region>
        {/* Sidebar - hidden in focus mode or when collapsed */}
        {!sidebarCollapsed && !focusMode && (
          <SectionErrorBoundary section="sidebar">
            <Sidebar />
          </SectionErrorBoundary>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden w-full">
          {/* TabBar - only show when not in special views and tabs are open */}
          {currentView === UIView.None && openTabs.length > 0 && !focusMode && (
            <TabBar />
          )}
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
