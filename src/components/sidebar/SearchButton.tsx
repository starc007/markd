import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="relative mb-1 flex min-h-8 w-full items-center gap-2 rounded-lg border-0 bg-transparent px-2 py-1.5 text-left text-sm font-medium text-sidebar-ink-soft transition-colors hover:bg-sidebar-active dark:text-sidebar-ink-soft-dark dark:hover:bg-sidebar-active-dark"
      onClick={onClick}
    >
      <HugeiconsIcon icon={Search01Icon} size={17} color="currentColor" />
      <span>Search</span>
    </button>
  );
}
