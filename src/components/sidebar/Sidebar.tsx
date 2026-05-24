import { useMemo } from "react";
import { useWorkspaceStore } from "@/stores/workspace";
import { SearchButton } from "./SearchButton";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarNav } from "./SidebarNav";
import { TrafficLights } from "./TrafficLights";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceTree } from "./WorkspaceTree";

export function Sidebar() {
  const manifest = useWorkspaceStore((state) => state.manifest);
  const activeNote = useWorkspaceStore((state) => state.activeNote);
  const view = useWorkspaceStore((state) => state.view);
  const query = useWorkspaceStore((state) => state.query);
  const setView = useWorkspaceStore((state) => state.setView);
  const setQuery = useWorkspaceStore((state) => state.setQuery);
  const openNote = useWorkspaceStore((state) => state.openNote);
  const createNote = useWorkspaceStore((state) => state.createNote);
  const setCommandOpen = useWorkspaceStore((state) => state.setCommandOpen);

  const notes = useMemo(() => {
    const list = manifest?.notes ?? [];
    if (!query.trim()) return list;
    return list.filter((note) =>
      note.title.toLowerCase().includes(query.toLowerCase()),
    );
  }, [manifest?.notes, query]);

  return (
    <aside className="relative flex min-h-screen flex-col overflow-hidden bg-[#1f1f1f] p-4 pb-[18px] text-[#d8d8d8] backdrop-blur-[28px] before:pointer-events-none before:absolute before:inset-0 before:bg-white/[0.07] max-[860px]:hidden">
      <TrafficLights />
      <WorkspaceHeader
        name={manifest?.name ?? "Draft Workspace"}
        onCreateNote={createNote}
      />
      <SearchButton onClick={() => setCommandOpen(true)} />
      <SidebarNav activeView={view} onSelect={setView} />
      <WorkspaceTree
        folders={manifest?.folders ?? []}
        notes={notes}
        activeId={activeNote?.meta.id}
        query={query}
        onQueryChange={setQuery}
        onOpen={openNote}
      />
      <SidebarFooter />
    </aside>
  );
}
