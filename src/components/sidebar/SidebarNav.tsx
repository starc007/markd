import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import { cx } from "@/components/ui";
import type { ViewMode } from "@/lib/types";
import { sidebarNavigation } from "./navigation";

export function SidebarNav({
  activeView,
  onSelect,
}: {
  activeView: ViewMode;
  onSelect: (view: ViewMode) => void;
}) {
  return (
    <nav className="relative mb-6 grid gap-0.5">
      {sidebarNavigation.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={cx(
            "relative flex min-h-8 w-full items-center gap-2 rounded-lg border-0 bg-transparent px-2 py-1.5 text-left text-sm font-medium text-sidebar-ink-soft transition-colors hover:bg-sidebar-active",
            activeView === item.id && "text-sidebar-ink-strong",
          )}
        >
          {activeView === item.id && (
            <motion.span
              layoutId="nav-pill"
              className="absolute inset-0 -z-10 rounded-lg bg-sidebar-active"
            />
          )}
          <HugeiconsIcon icon={item.icon} size={17} color="currentColor" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
