import type { FolderRecord, NoteRecord } from "@/lib/types";
import { FolderNode } from "./FolderNode";
import { NoteRow } from "./NoteRow";

export function NoteNode({
  note,
  folders,
  notes,
  activeId,
  onCreateFolder,
  onCreateNote,
  onDeleteFolder,
  onDeleteNote,
  onMoveNote,
  onOpen,
  onRenameFolder,
}: {
  note: NoteRecord;
  folders: FolderRecord[];
  notes: NoteRecord[];
  activeId?: string;
  onCreateFolder: (parentId: string) => void;
  onCreateNote: (folderId: string | null, parentId?: string | null) => void;
  onDeleteFolder: (folder: FolderRecord) => void;
  onDeleteNote: (id: string) => void;
  onMoveNote: (note: NoteRecord) => void;
  onOpen: (id: string) => void;
  onRenameFolder: (folder: FolderRecord) => void;
}) {
  const childFolders = folders.filter((folder) => folder.parentId === note.id);
  const childNotes = notes.filter((item) => item.parentId === note.id);
  const hasChildren = childFolders.length > 0 || childNotes.length > 0;

  return (
    <div>
      <NoteRow
        note={note}
        active={note.id === activeId}
        onCreateFolder={(note) => onCreateFolder(note.id)}
        onCreateNote={(note) => onCreateNote(note.folderId, note.id)}
        onDelete={onDeleteNote}
        onMove={onMoveNote}
        onOpen={onOpen}
      />
      {hasChildren && (
        <div className="ml-3 border-l border-sidebar-divider pl-2 dark:border-sidebar-divider-dark">
          {childFolders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              folders={folders}
              notes={notes}
              activeId={activeId}
              onCreateFolder={onCreateFolder}
              onCreateNote={onCreateNote}
              onDeleteFolder={onDeleteFolder}
              onDeleteNote={onDeleteNote}
              onMoveNote={onMoveNote}
              onOpen={onOpen}
              onRenameFolder={onRenameFolder}
            />
          ))}
          {childNotes.map((childNote) => (
            <NoteNode
              key={childNote.id}
              note={childNote}
              folders={folders}
              notes={notes}
              activeId={activeId}
              onCreateFolder={onCreateFolder}
              onCreateNote={onCreateNote}
              onDeleteFolder={onDeleteFolder}
              onDeleteNote={onDeleteNote}
              onMoveNote={onMoveNote}
              onOpen={onOpen}
              onRenameFolder={onRenameFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
