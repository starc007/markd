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
      <div className="mb-3 text-lg font-medium uppercase text-[#8b8b8b]">
        Workspace
      </div>
      <input
        className="mb-2.5 h-10 w-full rounded-xl border-0 bg-[#2a2a2a] px-3 text-[#e6e6e6] outline-none"
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
