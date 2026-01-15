import { useTabStore } from "@/stores/tabStore";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface TabProps {
  tabId: string;
  title: string;
  isActive: boolean;
  isDirty?: boolean;
  onClose?: (e: React.MouseEvent) => void;
}

export function Tab({ tabId, title, isActive, isDirty, onClose }: TabProps) {
  const { switchTab } = useTabStore();

  const handleClick = (e: React.MouseEvent) => {
    // Middle click to close
    if (e.button === 1) {
      e.preventDefault();
      if (onClose) {
        onClose(e);
      }
      return;
    }
    // Left click to switch
    if (e.button === 0) {
      switchTab(tabId);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClose) {
      onClose(e);
    }
  };

  // Truncate title if too long
  const displayTitle = title.length > 30 ? `${title.slice(0, 30)}...` : title;

  return (
    <div
      className={`
        group flex items-center gap-2 px-3 py-2 border-b-2 transition-colors
        ${
          isActive
            ? "border-primary bg-background text-foreground"
            : "border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/50"
        }
        cursor-pointer select-none
      `}
      onClick={handleClick}
      onMouseDown={handleClick}
    >
      <span className="text-sm font-medium truncate flex-1 min-w-0">
        {displayTitle}
        {isDirty && <span className="ml-1 text-primary">•</span>}
      </span>
      <button
        onClick={handleClose}
        className={`
          opacity-0 group-hover:opacity-100 transition-opacity
          p-0.5 rounded hover:bg-muted
          ${isActive ? "opacity-100" : ""}
        `}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <HugeiconsIcon
          icon={Cancel01Icon}
          size={14}
          color="currentColor"
          strokeWidth={1.5}
        />
      </button>
    </div>
  );
}
