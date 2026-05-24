import {
  FolderIcon,
  MoreHorizontalIcon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Dropdown, DropdownItem } from "@/components/ui";
import type { FolderRecord, NoteRecord } from "@/lib/types";
import { NoteRow } from "./NoteRow";

export function FolderNode({
  folder,
  folders,
  notes,
  activeId,
  onDeleteNote,
  onOpen,
  onRenameFolder,
}: {
  folder: FolderRecord;
  folders: FolderRecord[];
  notes: NoteRecord[];
  activeId?: string;
  onDeleteNote: (id: string) => void;
  onOpen: (id: string) => void;
  onRenameFolder: (folder: FolderRecord, name: string) => void;
}) {
  const childFolders = folders.filter((item) => item.parentId === folder.id);
  const childNotes = notes.filter(
    (note) => note.folderId === folder.id && !note.parentId,
  );

  return (
    <details open>
      <summary className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-sidebar-folder transition-colors hover:bg-sidebar-active dark:text-sidebar-folder-dark dark:hover:bg-sidebar-active-dark">
        <HugeiconsIcon icon={FolderIcon} size={16} color="currentColor" />
        <span className="min-w-0 flex-1 truncate">{folder.name}</span>
        <Dropdown
          label={
            <button
              aria-label={`Options for ${folder.name}`}
              className="grid h-6 w-6 place-items-center rounded-md text-sidebar-ink-muted opacity-0 transition-opacity hover:bg-sidebar-active hover:text-sidebar-ink-strong group-hover:opacity-100 data-[open]:opacity-100 dark:text-sidebar-ink-muted-dark dark:hover:bg-sidebar-active-dark dark:hover:text-sidebar-ink-strong-dark"
              onClick={(event) => event.stopPropagation()}
              type="button"
            >
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                size={15}
                color="currentColor"
              />
            </button>
          }
        >
          <DropdownItem
            onClick={() => {
              const name = window.prompt("Folder name", folder.name);
              if (name) onRenameFolder(folder, name);
            }}
          >
            <HugeiconsIcon
              icon={PencilEdit01Icon}
              size={15}
              color="currentColor"
            />
            Rename folder
          </DropdownItem>
        </Dropdown>
      </summary>
      <div className="ml-3 border-l border-sidebar-divider dark:border-sidebar-divider-dark pl-2">
        {childFolders.map((child) => (
          <FolderNode
            key={child.id}
            folder={child}
            folders={folders}
            notes={notes}
            activeId={activeId}
            onDeleteNote={onDeleteNote}
            onOpen={onOpen}
            onRenameFolder={onRenameFolder}
          />
        ))}
        {childNotes.map((note) => (
          <NoteRow
            key={note.id}
            note={note}
            active={note.id === activeId}
            onDelete={onDeleteNote}
            onOpen={onOpen}
          />
        ))}
      </div>
    </details>
  );
}
