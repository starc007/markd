import type { FolderRecord, NoteRecord } from "@/lib/types";
import { FolderNode } from "./FolderNode";
import { NoteNode } from "./NoteNode";

export function FolderTree({
  folders,
  notes,
  activeId,
  onDeleteNote,
  onDeleteFolder,
  onCreateFolder,
  onCreateNote,
  onOpen,
  onRenameFolder,
}: {
  folders: FolderRecord[];
  notes: NoteRecord[];
  activeId?: string;
  onDeleteNote: (id: string) => void;
  onDeleteFolder: (folder: FolderRecord) => void;
  onCreateFolder: (parentId: string) => void;
  onCreateNote: (folderId: string | null, parentId?: string | null) => void;
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
          onCreateFolder={onCreateFolder}
          onCreateNote={onCreateNote}
          onOpen={onOpen}
          onRenameFolder={onRenameFolder}
        />
      ))}
      {rootNotes.map((note) => (
        <NoteNode
          key={note.id}
          note={note}
          folders={folders}
          notes={notes}
          activeId={activeId}
          onCreateFolder={onCreateFolder}
          onCreateNote={onCreateNote}
          onDeleteFolder={onDeleteFolder}
          onDeleteNote={onDeleteNote}
          onOpen={onOpen}
          onRenameFolder={onRenameFolder}
        />
      ))}
    </div>
  );
}
