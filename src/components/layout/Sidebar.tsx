import {
  ArrowBigUp,
  ArrowDownToLine,
  Bookmark,
  CheckSquare,
  Command,
  FilePlus,
  FolderPlus,
  Search,
  Settings,
} from "lucide-react";
import { FileTree } from "@/components/tree/FileTree";
import { PinnedNotes } from "@/components/tree/PinnedNotes";
import { Tooltip } from "@/components/ui/Tooltip";
import { Spinner } from "@/components/ui/Spinner";
import { formatShortcutParts, type ShortcutBinding } from "@/lib/shortcuts";
import { cx, isMac } from "@/lib/utils";
import { useShortcuts } from "@/stores/shortcuts";
import { useUi } from "@/stores/ui";
import { useUpdater } from "@/stores/updater";
import { activeDir, useVault } from "@/stores/vault";

export function Sidebar() {
  const name = useVault((s) => s.name);
  const view = useVault((s) => s.view);
  const setView = useVault((s) => s.setView);
  const createNote = useVault((s) => s.createNote);
  const createFolder = useVault((s) => s.createFolder);
  const setSettingsOpen = useUi((s) => s.setSettingsOpen);
  const setPaletteOpen = useUi((s) => s.setPaletteOpen);
  const shortcuts = useShortcuts((s) => s.bindings);

  return (
    <aside
      data-markd-sidebar
      className="flex h-full w-[240px] shrink-0 flex-col border-r border-line-soft bg-panel"
    >
      {/* drag region + traffic-light clearance */}
      <div data-tauri-drag-region className="flex h-12 items-end px-3 pb-1" />

      <div className="px-2 pb-2">
        <button
          data-sidebar-focus-fallback
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex w-full items-center gap-2 rounded-md border border-line-soft bg-bg px-2.5 py-1.5 text-[12.5px] text-faint transition-colors duration-100 hover:border-line hover:text-muted"
        >
          <Search size={14} strokeWidth={2} className="shrink-0" />
          <span>Search…</span>
          <ShortcutHint shortcut={shortcuts.commandPalette} boxed />
        </button>
      </div>

      <div className="flex items-center px-4 pb-2">
        <span
          className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-faint"
          title={name}
        >
          {name}
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 px-2 pb-1">
        <PageLink
          active={view?.type === "todos"}
          icon={<CheckSquare size={15} strokeWidth={1.75} />}
          label="Todos"
          shortcut={shortcuts.openTodos}
          onClick={() => setView({ type: "todos" })}
        />
        <PageLink
          active={view?.type === "bookmarks"}
          icon={<Bookmark size={15} strokeWidth={1.75} />}
          label="Bookmarks"
          shortcut={shortcuts.openBookmarks}
          onClick={() => setView({ type: "bookmarks" })}
        />
      </nav>

      <div className="mx-4 my-2 border-t border-line-soft" />

      <PinnedNotes />

      <div className="flex items-center justify-between pl-4 pr-2 pb-1">
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
          <IconAction
            label="New folder"
            onClick={() => createFolder("", "Untitled")}
          >
            <FolderPlus size={14.5} strokeWidth={1.75} />
          </IconAction>
        </div>
      </div>

      <FileTree />

      <UpdateRow />

      <div className="border-t border-line-soft px-2 py-1.5">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex h-[30px] w-full items-center gap-2.5 rounded-md px-2 text-[13px] font-medium text-muted transition-colors duration-100 hover:bg-hover hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
        >
          <Settings size={15} strokeWidth={1.75} />
          <span>Settings</span>
          <kbd className="ml-auto font-mono text-[10px] font-normal text-faint">
            ⌘,
          </kbd>
        </button>
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

function UpdateRow() {
  const status = useUpdater((s) => s.status);
  const version = useUpdater((s) => s.version);
  const install = useUpdater((s) => s.install);

  if (
    status !== "available" &&
    status !== "downloading" &&
    status !== "ready"
  ) {
    return null;
  }
  const busy = status !== "available";

  return (
    <div className="border-t border-line-soft px-2 py-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={install}
        className="flex w-full items-center gap-2 rounded-md bg-hover px-2.5 py-1.5 text-[12.5px] font-medium text-ink transition-colors duration-100 hover:bg-active disabled:cursor-default disabled:hover:bg-hover"
      >
        {busy ? (
          <Spinner size={14} className="text-faint" />
        ) : (
          <ArrowDownToLine size={14} strokeWidth={2} className="shrink-0" />
        )}
        <span className="truncate">
          {busy ? "Updating…" : `Update to ${version}`}
        </span>
        {!busy && (
          <span className="ml-auto shrink-0 text-[11px] text-faint">
            Restart
          </span>
        )}
      </button>
    </div>
  );
}

function PageLink({
  active,
  icon,
  label,
  shortcut,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  shortcut?: ShortcutBinding;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cx(
        "flex h-[30px] w-full items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors duration-100",
        active
          ? "bg-active text-ink"
          : "text-muted hover:bg-hover hover:text-ink",
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {shortcut && <ShortcutHint shortcut={shortcut} active={active} />}
    </button>
  );
}

function ShortcutHint({
  shortcut,
  active = false,
  boxed = false,
}: {
  shortcut: ShortcutBinding;
  active?: boolean;
  boxed?: boolean;
}) {
  const mac = isMac();
  const parts = formatShortcutParts(shortcut, mac);
  return (
    <kbd
      aria-label={parts.join(" ")}
      className={cx(
        "ml-auto flex shrink-0 items-center gap-0.5 font-mono text-[10px] font-normal",
        boxed && "rounded border border-line bg-panel px-1 leading-4",
        active ? "text-muted" : "text-faint",
      )}
    >
      {parts.map((part, index) =>
        part === "⌘" ? (
          <Command key={`${part}-${index}`} size={10.5} strokeWidth={1.8} />
        ) : part === "⇧" ? (
          <ArrowBigUp key={`${part}-${index}`} size={10.5} strokeWidth={1.8} />
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </kbd>
  );
}
