import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function WorkspaceHeader({
  name,
  onCreateNote,
}: {
  name: string;
  onCreateNote: () => void;
}) {
  return (
    <div className="relative mb-4 flex min-h-9 items-center gap-2.5 px-1">
      <div className="grid h-7 w-7 place-items-center rounded-lg bg-sidebar-logo-bg text-xs font-bold text-sidebar">
        D
      </div>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <strong className="truncate text-sm font-semibold leading-none text-sidebar-ink-strong">
          {name}
        </strong>
        <span className="text-[11px] text-sidebar-ink-muted">Local workspace</span>
      </div>
      <button
        className="grid h-7 w-7 place-items-center rounded-lg bg-transparent text-sidebar-ink-soft transition-colors hover:bg-sidebar-active"
        onClick={onCreateNote}
        aria-label="New note"
      >
        <HugeiconsIcon icon={Add01Icon} size={16} color="currentColor" />
      </button>
    </div>
  );
}
