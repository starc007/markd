import {
  Bookmark,
  CheckSquare,
  FilePlus,
  FolderPlus,
  Settings,
} from "lucide-react";
import { FileTree } from "@/components/tree/FileTree";
import { Tooltip } from "@/components/ui/Tooltip";
import { cx } from "@/lib/utils";
import { useUi } from "@/stores/ui";
import { activeDir, useVault } from "@/stores/vault";
import { HoverPill, SidebarHover, useHoverRow } from "./SidebarHover";

export function Sidebar() {
  const name = useVault((s) => s.name);
  const view = useVault((s) => s.view);
  const setView = useVault((s) => s.setView);
  const createNote = useVault((s) => s.createNote);
  const createFolder = useVault((s) => s.createFolder);
  const setSettingsOpen = useUi((s) => s.setSettingsOpen);
  const saveState = useUi((s) => s.saveState);

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-line-soft bg-panel">
      {/* drag region + traffic-light clearance */}
      <div data-tauri-drag-region className="flex h-12 items-end px-3 pb-1" />

      <div className="flex items-center px-4 pb-2">
        <span
          className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-faint"
          title={name}
        >
          {name}
        </span>
      </div>

      <SidebarHover>
        <nav className="px-2 pb-1">
          <PageLink
            id="nav:todos"
            active={view?.type === "todos"}
            icon={<CheckSquare size={14.5} strokeWidth={1.75} />}
            label="Todos"
            onClick={() => setView({ type: "todos" })}
          />
          <PageLink
            id="nav:bookmarks"
            active={view?.type === "bookmarks"}
            icon={<Bookmark size={14.5} strokeWidth={1.75} />}
            label="Bookmarks"
            onClick={() => setView({ type: "bookmarks" })}
          />
        </nav>

        <div className="mx-4 my-1.5 border-t border-line-soft" />

        <div className="flex items-center justify-between pl-4 pr-2 pb-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
            Notes
          </span>
          <div className="flex items-center gap-0.5">
            <IconAction
              label="New note"
              onClick={() => createNote(activeDir(useVault.getState()))}
            >
              <FilePlus size={14.5} strokeWidth={1.75} />
            </IconAction>
            <IconAction label="New folder" onClick={() => createFolder("", "Untitled")}>
              <FolderPlus size={14.5} strokeWidth={1.75} />
            </IconAction>
          </div>
        </div>

        <FileTree />
      </SidebarHover>

      <div className="flex items-center justify-between border-t border-line-soft px-2 py-1.5">
        <IconAction label="Settings" onClick={() => setSettingsOpen(true)}>
          <Settings size={15} strokeWidth={1.75} />
        </IconAction>
        <span
          className={cx(
            "pr-2 text-[11px] transition-opacity duration-300",
            saveState === "idle" && "opacity-0",
            saveState === "saving" && "text-faint opacity-100",
            saveState === "error" && "text-danger opacity-100",
          )}
        >
          {saveState === "error" ? "not saved" : "saving…"}
        </span>
      </div>
    </aside>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        className="grid h-6.5 w-6.5 place-items-center rounded-md text-faint transition-colors duration-100 hover:bg-hover hover:text-ink"
      >
        {children}
      </button>
    </Tooltip>
  );
}

function PageLink({
  id,
  active,
  icon,
  label,
  onClick,
}: {
  id: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const hover = useHoverRow(id);
  return (
    <button
      type="button"
      onClick={onClick}
      {...hover}
      className={cx(
        "relative flex h-[26px] w-full items-center rounded-md px-1.5 text-[13px] transition-colors duration-100",
        active ? "bg-active text-ink" : "text-muted hover:text-ink",
      )}
    >
      <HoverPill id={id} />
      <span className="relative z-10 flex items-center gap-2">
        {icon}
        <span className="font-medium">{label}</span>
      </span>
    </button>
  );
}
