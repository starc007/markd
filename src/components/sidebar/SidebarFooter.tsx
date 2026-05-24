import { Settings02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function SidebarFooter() {
  return (
    <button className="relative mt-auto flex min-h-12 items-center gap-3.5 border-0 bg-transparent text-[22px] font-medium text-[#f3f3f3]">
      <HugeiconsIcon icon={Settings02Icon} size={28} color="currentColor" />
      <span>Settings</span>
    </button>
  );
}
