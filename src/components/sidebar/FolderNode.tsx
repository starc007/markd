import { FolderIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { FolderRecord, NoteRecord } from "@/lib/types";
import { NoteRow } from "./NoteRow";

export function FolderNode({
  folder,
  folders,
  notes,
  activeId,
  onOpen,
}: {
  folder: FolderRecord;
  folders: FolderRecord[];
  notes: NoteRecord[];
  activeId?: string;
  onOpen: (id: string) => void;
}) {
  const childFolders = folders.filter((item) => item.parentId === folder.id);
  const childNotes = notes.filter(
    (note) => note.folderId === folder.id && !note.parentId,
  );

  return (
    <details open>
      <summary className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-sidebar-folder transition-colors hover:bg-sidebar-active">
        <HugeiconsIcon icon={FolderIcon} size={16} color="currentColor" />
        {folder.name}
      </summary>
      <div className="ml-3 border-l border-sidebar-divider pl-2">
        {childFolders.map((child) => (
          <FolderNode
            key={child.id}
            folder={child}
            folders={folders}
            notes={notes}
            activeId={activeId}
            onOpen={onOpen}
          />
        ))}
        {childNotes.map((note) => (
          <NoteRow
            key={note.id}
            note={note}
            active={note.id === activeId}
            onOpen={onOpen}
          />
        ))}
      </div>
    </details>
  );
}
