import { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Task01Icon,
  FavouriteIcon,
  FolderIcon,
  SettingsIcon,
  EditIcon,
  File02Icon,
} from "@hugeicons/core-free-icons";
import { useNoteStore } from "../../stores/noteStore";

import { Button, NavItem, SectionHeading } from "../ui";

export function Sidebar() {
  const {
    notes,
    folders,
    ui,
    currentNote,
    loadNotes,
    loadFolders,
    selectFolder,
    createNote,
    loadNote,
  } = useNoteStore();

  useEffect(() => {
    loadFolders();
    loadNotes();
  }, [loadFolders, loadNotes]);

  const handleNewNote = async () => {
    const note = await createNote("Untitled", ui.selectedFolderId || undefined);
    if (note) {
      loadNote(note.id);
    }
  };

  return (
    <aside className="w-[280px] shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden">
      {/* App Branding */}
      {/* <div className="px-4 pb-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <NotePencil className="w-5 h-5 text-foreground" weight="duotone" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sidebar-foreground truncate">
              {APP_CONFIG.name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              Local Notes
            </div>
          </div>
        </div>
      </div> */}

      {/* New Note Button */}
      <div className="pt-3 px-3">
        <Button
          onClick={handleNewNote}
          className="hover:bg-transparent [-webkit-app-region:no-drag]"
          variant="ghost"
        >
          <HugeiconsIcon
            icon={EditIcon}
            size={16}
            color="currentColor"
            strokeWidth={1.5}
          />
          New Note
        </Button>
      </div>

      {/* Navigation - Fixed */}
      <div className="shrink-0 p-3 space-y-6 border-b border-sidebar-border">
        {/* Main Section */}
        <div>
          <SectionHeading>Main</SectionHeading>
          <div className="space-y-0.5">
            <NavItem
              icon={
                <HugeiconsIcon
                  icon={Task01Icon}
                  size={20}
                  color="currentColor"
                  strokeWidth={1.5}
                />
              }
              label="All notes"
              count={notes.length}
              isActive={ui.selectedFolderId === null}
              onClick={() => selectFolder(null)}
            />
            <NavItem
              icon={
                <HugeiconsIcon
                  icon={FavouriteIcon}
                  size={20}
                  color="currentColor"
                  strokeWidth={1.5}
                />
              }
              label="Favorites"
              onClick={() => {}}
            />
          </div>
        </div>

        {/* Folders Section */}
        <div>
          <SectionHeading>Folders</SectionHeading>
          <div className="space-y-0.5">
            {folders.length > 0 ? (
              folders.map((folder) => (
                <NavItem
                  key={folder.id}
                  icon={
                    <HugeiconsIcon
                      icon={FolderIcon}
                      size={20}
                      color="currentColor"
                      strokeWidth={1.5}
                    />
                  }
                  label={folder.name}
                  count={notes.filter((n) => n.folder_id === folder.id).length}
                  isActive={ui.selectedFolderId === folder.id}
                  onClick={() => selectFolder(folder.id)}
                />
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No folders yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notes List Section - Scrollable */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-3 pt-3 pb-2">
          <SectionHeading>Notes</SectionHeading>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {(() => {
            const filteredNotes = notes.filter(
              (note) =>
                ui.selectedFolderId === null ||
                note.folder_id === ui.selectedFolderId
            );

            // Sort by updated_at descending
            const sortedNotes = [...filteredNotes].sort(
              (a, b) => b.updated_at - a.updated_at
            );

            if (sortedNotes.length === 0) {
              return (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No notes yet
                </p>
              );
            }

            return sortedNotes.map((note) => {
              const isActive = currentNote?.id === note.id;
              return (
                <button
                  key={note.id}
                  onClick={() => loadNote(note.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors [-webkit-app-region:no-drag] ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 text-sidebar-foreground"
                  }`}
                >
                  <HugeiconsIcon
                    icon={File02Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.5}
                    className={`shrink-0 mt-0.5 ${
                      isActive ? "opacity-100" : "opacity-40"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium truncate ${
                        isActive ? "text-accent-foreground" : "text-foreground"
                      }`}
                    >
                      {note.title || "Untitled"}
                    </div>
                    {/* <div className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(note.updated_at)}
                    </div> */}
                  </div>
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* Settings Section */}
      <div className="p-3 border-t border-sidebar-border">
        <SectionHeading>Settings</SectionHeading>
        <div className="space-y-0.5">
          <NavItem
            icon={
              <HugeiconsIcon
                icon={SettingsIcon}
                size={20}
                color="currentColor"
                strokeWidth={1.5}
              />
            }
            label="Settings"
            onClick={() => {}}
          />
        </div>
      </div>
    </aside>
  );
}
