import type { FolderRecord, NoteRecord } from "@/lib/types";
import { FolderNode } from "./FolderNode";
import { NoteRow } from "./NoteRow";

export function FolderTree({
  folders,
  notes,
  activeId,
  onDeleteNote,
  onDeleteFolder,
  onOpen,
  onRenameFolder,
}: {
  folders: FolderRecord[];
  notes: NoteRecord[];
  activeId?: string;
  onDeleteNote: (id: string) => void;
  onDeleteFolder: (folder: FolderRecord) => void;
  onOpen: (id: string) => void;
  onRenameFolder: (folder: FolderRecord) => void;
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
          onDeleteNote={onDeleteNote}
          onDeleteFolder={onDeleteFolder}
          onOpen={onOpen}
          onRenameFolder={onRenameFolder}
        />
      ))}
      {rootNotes.map((note) => (
        <NoteRow
          key={note.id}
          note={note}
          active={note.id === activeId}
          onDelete={onDeleteNote}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
