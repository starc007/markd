import {
  Bookmark,
  CheckSquare,
  FilePlus,
  FolderPlus,
  Settings,
} from "lucide-react";
import { FileTree } from "@/components/tree/FileTree";
import { cx } from "@/lib/utils";
import { useUi } from "@/stores/ui";
import { activeDir, useVault } from "@/stores/vault";

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

      <div className="flex items-center justify-between px-4 pb-2">
        <span
          className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-faint"
          title={name}
        >
          {name}
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

      <nav className="px-2 pb-1">
        <PageLink
          active={view?.type === "todos"}
          icon={<CheckSquare size={14.5} strokeWidth={1.75} />}
          label="Todos"
          onClick={() => setView({ type: "todos" })}
        />
        <PageLink
          active={view?.type === "bookmarks"}
          icon={<Bookmark size={14.5} strokeWidth={1.75} />}
          label="Bookmarks"
          onClick={() => setView({ type: "bookmarks" })}
        />
      </nav>

      <div className="mx-4 my-1.5 border-t border-line-soft" />

      <FileTree />

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
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-6.5 w-6.5 place-items-center rounded-md text-faint transition-colors duration-100 hover:bg-hover hover:text-ink"
    >
      {children}
    </button>
  );
}

function PageLink({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex h-[26px] w-full items-center gap-2 rounded-md px-1.5 text-[13px] transition-colors duration-100",
        active
          ? "bg-invert text-invert-ink"
          : "text-muted hover:bg-hover hover:text-ink",
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}
