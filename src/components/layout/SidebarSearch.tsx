import { HugeiconsIcon } from "@hugeicons/react";
import { CommandIcon, SearchIcon } from "@hugeicons/core-free-icons";

interface SidebarSearchProps {
  onSearchClick: () => void;
}

export function SidebarSearch({ onSearchClick }: SidebarSearchProps) {
  return (
    <div className="relative [-webkit-app-region:no-drag] px-3 pt-3">
      <div className="relative w-full">
        <HugeiconsIcon
          icon={SearchIcon}
          size={16}
          color="currentColor"
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          readOnly
          onClick={onSearchClick}
          onFocus={onSearchClick}
          placeholder="Search"
          className="w-full pl-10 pr-14 py-2 text-[13px] bg-secondary border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground outline-none cursor-pointer hover:bg-accent transition-colors"
        />
        {/* Keyboard shortcut hint */}
        <p className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-sm font-mono font-medium text-muted-foreground pointer-events-none">
          <HugeiconsIcon
            icon={CommandIcon}
            size={15}
            color="currentColor"
            strokeWidth={1.5}
          />
          K
        </p>
      </div>
    </div>
  );
}
