import { useEffect } from "react";
import {
  ClipboardText,
  Heart,
  Clock,
  Tag,
  Folder,
  Gear,
  NotePencil,
  PencilSimpleLine,
} from "@phosphor-icons/react";
import { useNoteStore } from "../../stores/noteStore";
import { APP_CONFIG } from "../../lib/config";
import { Button, NavItem, SectionHeading } from "../ui";

export function Sidebar() {
  const {
    notes,
    folders,
    ui,
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
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <NotePencil className="w-5 h-5 text-foreground" weight="duotone" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sidebar-foreground truncate">
              {APP_CONFIG.name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {APP_CONFIG.description}
            </div>
          </div>
        </div>
      </div>

      {/* New Note Button */}
      <div className="pt-3 px-3">
        <Button
          onClick={handleNewNote}
          className="hover:bg-transparent"
          variant="ghost"
        >
          <PencilSimpleLine className="w-4 h-4" weight="bold" />
          New Note
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Main Section */}
        <div>
          <SectionHeading>Main</SectionHeading>
          <div className="space-y-0.5">
            <NavItem
              icon={<ClipboardText className="w-5 h-5" weight="duotone" />}
              label="All notes"
              count={notes.length}
              isActive={ui.selectedFolderId === null}
              onClick={() => selectFolder(null)}
            />
            <NavItem
              icon={<Heart className="w-5 h-5" weight="duotone" />}
              label="Favorites"
              onClick={() => {}}
            />
            <NavItem
              icon={<Clock className="w-5 h-5" weight="duotone" />}
              label="Recent notes"
              onClick={() => {}}
            />
            <NavItem
              icon={<Tag className="w-5 h-5" weight="duotone" />}
              label="Tags"
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
                  icon={<Folder className="w-5 h-5" weight="duotone" />}
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

      {/* Settings Section */}
      <div className="p-3 border-t border-sidebar-border">
        <SectionHeading>Settings</SectionHeading>
        <div className="space-y-0.5">
          <NavItem
            icon={<Gear className="w-5 h-5" weight="duotone" />}
            label="Settings"
            onClick={() => {}}
          />
        </div>
      </div>
    </aside>
  );
}
