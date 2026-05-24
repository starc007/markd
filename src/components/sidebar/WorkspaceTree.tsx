import { FolderAddIcon, NoteAddIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tooltip } from "@/components/ui";
import type { FolderRecord, NoteRecord } from "@/lib/types";
import { FolderTree } from "./FolderTree";

export function WorkspaceTree({
  folders,
  notes,
  activeId,
  onDeleteNote,
  onDeleteFolder,
  onOpen,
  onCreateNote,
  onCreateFolder,
  onRenameFolder,
}: {
  folders: FolderRecord[];
  notes: NoteRecord[];
  activeId?: string;
  onDeleteNote: (id: string) => void;
  onDeleteFolder: (folder: FolderRecord) => void;
  onOpen: (id: string) => void;
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onRenameFolder: (folder: FolderRecord) => void;
}) {
  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between px-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-sidebar-ink-faint dark:text-sidebar-ink-faint-dark">
          Workspace
        </div>
        <div className="flex items-center gap-0.5">
          <Tooltip label="New note" place="right">
            <button
              className="grid h-6 w-6 place-items-center rounded-md text-sidebar-ink-muted transition-colors hover:bg-sidebar-active hover:text-sidebar-ink-strong dark:text-sidebar-ink-muted-dark dark:hover:bg-sidebar-active-dark dark:hover:text-sidebar-ink-strong-dark"
              onClick={onCreateNote}
              aria-label="New note"
            >
              <HugeiconsIcon icon={NoteAddIcon} size={15} color="currentColor" />
            </button>
          </Tooltip>
          <Tooltip label="New folder" place="right">
            <button
              className="grid h-6 w-6 place-items-center rounded-md text-sidebar-ink-muted transition-colors hover:bg-sidebar-active hover:text-sidebar-ink-strong dark:text-sidebar-ink-muted-dark dark:hover:bg-sidebar-active-dark dark:hover:text-sidebar-ink-strong-dark"
              onClick={onCreateFolder}
              aria-label="New folder"
            >
              <HugeiconsIcon icon={FolderAddIcon} size={15} color="currentColor" />
            </button>
          </Tooltip>
        </div>
      </div>
      <FolderTree
        folders={folders}
        notes={notes}
        activeId={activeId}
        onDeleteNote={onDeleteNote}
        onDeleteFolder={onDeleteFolder}
        onOpen={onOpen}
        onRenameFolder={onRenameFolder}
      />
    </div>
  );
}
