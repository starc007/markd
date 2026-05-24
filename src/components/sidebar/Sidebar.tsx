import { useMemo } from "react";
import { useWorkspaceStore } from "@/stores/workspace";
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
  const setCommandOpen = useWorkspaceStore((state) => state.setCommandOpen);

  const notes = useMemo(() => {
    return manifest?.notes ?? [];
  }, [manifest?.notes]);

  return (
    <aside className="relative flex min-h-screen flex-col overflow-hidden border-r border-sidebar-divider dark:border-sidebar-divider-dark bg-sidebar dark:bg-sidebar-dark px-3 pb-4 pt-10 text-sidebar-ink dark:text-sidebar-ink-dark max-[860px]:hidden">
      <WorkspaceHeader
        name={manifest?.name ?? "Draft Workspace"}
        onCreateNote={createNote}
      />
      <SidebarNav
        activeView={view}
        onSelect={setView}
        onCreateNote={createNote}
        onSearch={() => setCommandOpen(true)}
      />
      <WorkspaceTree
        folders={manifest?.folders ?? []}
        notes={notes}
        activeId={activeNote?.meta.id}
        onOpen={openNote}
      />
    </aside>
  );
}
