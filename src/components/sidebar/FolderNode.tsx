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
      <summary className="flex cursor-pointer items-center gap-2 px-3.5 py-2 text-[19px] font-medium text-[#b8b8b8]">
        <HugeiconsIcon icon={FolderIcon} size={15} color="currentColor" />
        {folder.name}
      </summary>
      <div className="ml-[18px] pl-2.5">
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
