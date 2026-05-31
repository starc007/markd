import { useMemo, useState } from "react";
import { Button, ConfirmModal, Modal } from "@/components/ui";
import { useWorkspaceStore } from "@/stores/workspace";
import type { FolderRecord, NoteRecord } from "@/lib/types";
import { SidebarNav } from "./SidebarNav";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceTree } from "./WorkspaceTree";

export function Sidebar() {
  const manifest = useWorkspaceStore((state) => state.manifest);
  const activeNote = useWorkspaceStore((state) => state.activeNote);
  const view = useWorkspaceStore((state) => state.view);
  const setView = useWorkspaceStore((state) => state.setView);
  const openNote = useWorkspaceStore((state) => state.openNote);
  const createNote = useWorkspaceStore((state) => state.createNote);
  const createFolder = useWorkspaceStore((state) => state.createFolder);
  const deleteFolder = useWorkspaceStore((state) => state.deleteFolder);
  const deleteNote = useWorkspaceStore((state) => state.deleteNote);
  const moveNote = useWorkspaceStore((state) => state.moveNote);
  const renameFolder = useWorkspaceStore((state) => state.renameFolder);
  const setCommandOpen = useWorkspaceStore((state) => state.setCommandOpen);
  const [noteToDelete, setNoteToDelete] = useState<NoteRecord | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderRecord | null>(
    null,
  );
  const [folderToRename, setFolderToRename] = useState<FolderRecord | null>(
    null,
  );
  const [folderName, setFolderName] = useState("");
  const [noteToMove, setNoteToMove] = useState<NoteRecord | null>(null);
  const [moveTarget, setMoveTarget] = useState("root");

  const notes = useMemo(() => {
    return manifest?.notes ?? [];
  }, [manifest?.notes]);

  const folderDeleteCount = useMemo(() => {
    if (!folderToDelete || !manifest) return { folders: 0, notes: 0 };
    const folderIds = new Set<string>();
    const collect = (folderId: string) => {
      folderIds.add(folderId);
      manifest.folders
        .filter((folder) => folder.parentId === folderId)
        .forEach((folder) => collect(folder.id));
    };

    collect(folderToDelete.id);

    return {
      folders: folderIds.size,
      notes: manifest.notes.filter((note) =>
        note.folderId ? folderIds.has(note.folderId) : false,
      ).length,
    };
  }, [folderToDelete, manifest]);

  const moveTargets = useMemo(() => {
    if (!manifest || !noteToMove) return [];
    const blockedNoteIds = new Set<string>();
    const collectNotes = (noteId: string) => {
      blockedNoteIds.add(noteId);
      manifest.notes
        .filter((note) => note.parentId === noteId)
        .forEach((note) => collectNotes(note.id));
    };
    collectNotes(noteToMove.id);

    return [
      { id: "root", label: "Workspace root", folderId: null, parentId: null },
      ...manifest.folders.map((folder) => ({
        id: `folder:${folder.id}`,
        label: `Folder / ${folder.name}`,
        folderId: folder.id,
        parentId: null,
      })),
      ...manifest.notes
        .filter((note) => !blockedNoteIds.has(note.id))
        .map((note) => ({
          id: `note:${note.id}`,
          label: `Inside note / ${note.title}`,
          folderId: note.folderId,
          parentId: note.id,
        })),
    ];
  }, [manifest, noteToMove]);

  return (
    <>
      <aside className="relative flex h-screen min-h-0 flex-col overflow-hidden border-r border-sidebar-divider dark:border-sidebar-divider-dark bg-sidebar dark:bg-sidebar-dark px-3 pb-4 pt-10 text-sidebar-ink dark:text-sidebar-ink-dark max-[860px]:hidden">
        <WorkspaceHeader
          name={manifest?.name ?? "Draft Workspace"}
          onCreateNote={() => createNote()}
        />
        <SidebarNav
          activeView={view}
          onSelect={setView}
          onCreateNote={() => createNote()}
          onSearch={() => setCommandOpen(true)}
        />
        <WorkspaceTree
          folders={manifest?.folders ?? []}
          notes={notes}
          activeId={activeNote?.meta.id}
          onDeleteNote={(id) => {
            const note = notes.find((item) => item.id === id);
            if (note) setNoteToDelete(note);
          }}
          onDeleteFolder={setFolderToDelete}
          onOpen={openNote}
          onCreateNote={() => createNote()}
          onCreateFolder={() => createFolder()}
          onCreateNoteInside={(folderId, parentId = null) =>
            createNote(folderId, parentId)
          }
          onCreateFolderInside={(parentId) => createFolder(parentId)}
          onMoveNote={(note) => {
            setNoteToMove(note);
            setMoveTarget("root");
          }}
          onRenameFolder={(folder) => {
            setFolderToRename(folder);
            setFolderName(folder.name);
          }}
        />
      </aside>

      <ConfirmModal
        actionLabel="Delete note"
        open={Boolean(noteToDelete)}
        title="Delete note?"
        onClose={() => setNoteToDelete(null)}
        onConfirm={() => {
          if (!noteToDelete) return;
          deleteNote(noteToDelete.id);
          setNoteToDelete(null);
        }}
      >
        This will remove "{noteToDelete?.title}" from the workspace and delete
        its Markdown file from disk.
      </ConfirmModal>

      <ConfirmModal
        actionLabel="Delete folder"
        open={Boolean(folderToDelete)}
        title="Delete folder?"
        onClose={() => setFolderToDelete(null)}
        onConfirm={() => {
          if (!folderToDelete) return;
          deleteFolder(folderToDelete.id);
          setFolderToDelete(null);
        }}
      >
        This will delete "{folderToDelete?.name}", {folderDeleteCount.folders}{" "}
        folder{folderDeleteCount.folders === 1 ? "" : "s"}, and{" "}
        {folderDeleteCount.notes} note
        {folderDeleteCount.notes === 1 ? "" : "s"} inside it. The Markdown files
        for those notes will be removed from disk.
      </ConfirmModal>

      <Modal
        open={Boolean(folderToRename)}
        title="Rename folder"
        onClose={() => setFolderToRename(null)}
      >
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!folderToRename) return;
            renameFolder(folderToRename, folderName);
            setFolderToRename(null);
          }}
        >
          <label className="grid gap-2 text-sm font-medium text-muted dark:text-muted-dark">
            Folder name
            <input
              autoFocus
              className="h-10 rounded-xl border border-line bg-panel px-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-focus-line dark:border-tooltip-ink/15 dark:bg-tooltip-ink/10 dark:text-tooltip-ink dark:placeholder:text-tooltip-ink/45 dark:focus:border-tooltip-ink/35"
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
            />
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFolderToRename(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Rename
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(noteToMove)}
        title="Move note"
        onClose={() => setNoteToMove(null)}
      >
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!noteToMove) return;
            const target = moveTargets.find((item) => item.id === moveTarget);
            if (!target) return;
            moveNote(noteToMove, target.folderId, target.parentId);
            setNoteToMove(null);
          }}
        >
          <label className="grid gap-2 text-sm font-medium text-muted dark:text-muted-dark">
            Destination
            <select
              autoFocus
              className="h-10 rounded-xl border border-line bg-panel px-3 text-sm text-ink outline-none transition-colors focus:border-focus-line dark:border-tooltip-ink/15 dark:bg-tooltip-ink/10 dark:text-tooltip-ink dark:focus:border-tooltip-ink/35"
              value={moveTarget}
              onChange={(event) => setMoveTarget(event.target.value)}
            >
              {moveTargets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.label}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setNoteToMove(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Move note
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
