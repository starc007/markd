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
    <nav className="relative mb-9 grid gap-1">
      {sidebarNavigation.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={cx(
            "relative flex min-h-11 w-full items-center gap-2.5 rounded-[13px] border-0 bg-transparent px-3.5 py-[7px] text-left text-[21px] font-medium text-[#cfcfcf]",
            activeView === item.id && "text-[#f3f3f3]",
          )}
        >
          {activeView === item.id && (
            <motion.span
              layoutId="nav-pill"
              className="absolute inset-0 -z-10 rounded-[13px] bg-[#3a3a3a]"
            />
          )}
          <HugeiconsIcon icon={item.icon} size={27} color="currentColor" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
