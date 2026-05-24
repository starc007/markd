import type { FolderRecord, NoteRecord } from "@/lib/types";
import { FolderNode } from "./FolderNode";
import { NoteRow } from "./NoteRow";

export function FolderTree({
  folders,
  notes,
  activeId,
  onOpen,
}: {
  folders: FolderRecord[];
  notes: NoteRecord[];
  activeId?: string;
  onOpen: (id: string) => void;
}) {
  const rootNotes = notes.filter((note) => !note.folderId && !note.parentId);
  const rootFolders = folders.filter((folder) => !folder.parentId);

  return (
    <div className="grid gap-1">
      {rootFolders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          folders={folders}
          notes={notes}
          activeId={activeId}
          onOpen={onOpen}
        />
      ))}
      {rootNotes.map((note) => (
        <NoteRow
          key={note.id}
          note={note}
          active={note.id === activeId}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
