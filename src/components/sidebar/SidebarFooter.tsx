import { Settings02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function SidebarFooter() {
  return (
    <button className="relative mt-auto flex min-h-9 items-center gap-2 rounded-lg border-0 bg-transparent px-2 text-sm font-medium text-sidebar-ink-soft transition-colors hover:bg-sidebar-active">
      <HugeiconsIcon icon={Settings02Icon} size={17} color="currentColor" />
      <span>Settings</span>
    </button>
  );
}
