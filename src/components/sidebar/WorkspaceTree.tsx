import type { FolderRecord, NoteRecord } from "@/lib/types";
import { FolderTree } from "./FolderTree";

export function WorkspaceTree({
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
  return (
    <div className="relative">
      <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-sidebar-ink-faint dark:text-sidebar-ink-faint-dark">
        Workspace
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
