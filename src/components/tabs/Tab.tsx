import { useTabStore } from "@/stores/tabStore";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";

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
    <motion.div
      layout
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 520, damping: 38 }}
      className={`
        group relative flex h-9 min-w-[138px] max-w-[220px] items-center gap-2 rounded-[14px] px-3 transition-colors
        ${
          isActive
            ? "bg-white/72 text-foreground ring-1 ring-white/70 dark:bg-white/10 dark:ring-white/10"
            : "bg-transparent text-muted-foreground hover:bg-white/42 dark:hover:bg-white/8"
        }
        cursor-pointer select-none
      `}
      onClick={handleClick}
      onMouseDown={handleClick}
    >
      <span className="text-[13px] font-medium truncate flex-1 min-w-0">
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
          size={16}
          color="currentColor"
          strokeWidth={1.5}
        />
      </button>
    </motion.div>
  );
}
