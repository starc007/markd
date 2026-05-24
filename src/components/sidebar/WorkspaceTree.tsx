import type { FolderRecord, NoteRecord } from "@/lib/types";
import { FolderTree } from "./FolderTree";

export function WorkspaceTree({
  folders,
  notes,
  activeId,
  query,
  onQueryChange,
  onOpen,
}: {
  folders: FolderRecord[];
  notes: NoteRecord[];
  activeId?: string;
  query: string;
  onQueryChange: (query: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="relative">
      <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-sidebar-ink-faint">
        Workspace
      </div>
      <input
        className="mb-2 h-8 w-full rounded-lg border border-line-soft bg-sidebar-field px-2.5 text-sm text-sidebar-field-ink outline-none placeholder:text-sidebar-ink-muted focus:border-focus-line"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Filter files"
      />
      <FolderTree
        folders={folders}
        notes={notes}
        activeId={activeId}
        onOpen={onOpen}
      />
    </div>
  );
}
