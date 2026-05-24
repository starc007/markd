import { FolderAddIcon, NoteAddIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { FolderRecord, NoteRecord } from "@/lib/types";
import { FolderTree } from "./FolderTree";

export function WorkspaceTree({
  folders,
  notes,
  activeId,
  onOpen,
  onCreateNote,
  onCreateFolder,
}: {
  folders: FolderRecord[];
  notes: NoteRecord[];
  activeId?: string;
  onOpen: (id: string) => void;
  onCreateNote: () => void;
  onCreateFolder: () => void;
}) {
  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between px-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-sidebar-ink-faint dark:text-sidebar-ink-faint-dark">
          Workspace
        </div>
        <div className="flex items-center gap-0.5">
          <button
            className="grid h-6 w-6 place-items-center rounded-md text-sidebar-ink-muted transition-colors hover:bg-sidebar-active hover:text-sidebar-ink-strong dark:text-sidebar-ink-muted-dark dark:hover:bg-sidebar-active-dark dark:hover:text-sidebar-ink-strong-dark"
            onClick={onCreateNote}
            aria-label="New note"
            title="New note"
          >
            <HugeiconsIcon icon={NoteAddIcon} size={15} color="currentColor" />
          </button>
          <button
            className="grid h-6 w-6 place-items-center rounded-md text-sidebar-ink-muted transition-colors hover:bg-sidebar-active hover:text-sidebar-ink-strong dark:text-sidebar-ink-muted-dark dark:hover:bg-sidebar-active-dark dark:hover:text-sidebar-ink-strong-dark"
            onClick={onCreateFolder}
            aria-label="New folder"
            title="New folder"
          >
            <HugeiconsIcon icon={FolderAddIcon} size={15} color="currentColor" />
          </button>
        </div>
      </div>
      <FolderTree
        folders={folders}
        notes={notes}
        activeId={activeId}
        onOpen={onOpen}
      />
    </div>
  );
}
