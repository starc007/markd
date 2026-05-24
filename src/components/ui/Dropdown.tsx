import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  Portal,
} from "@headlessui/react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const MotionMenuItems = motion.create(MenuItems);

// Dropdown Root
interface DropdownProps {
  children: React.ReactNode;
  className?: string;
}

export function Dropdown({ children, className }: DropdownProps) {
  return (
    <Menu as="div" className={cn("relative", className)}>
      {children}
    </Menu>
  );
}

// Dropdown Trigger
interface DropdownTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownTrigger({ children, className }: DropdownTriggerProps) {
  return (
    <MenuButton as="div" className={className}>
      {children}
    </MenuButton>
  );
}

// Dropdown Content
type DropdownAlign = "start" | "end";

interface DropdownContentProps {
  children: React.ReactNode;
  align?: DropdownAlign;
  className?: string;
}

export function DropdownContent({
  children,
  align = "end",
  className,
}: DropdownContentProps) {
  return (
    <Portal>
      <AnimatePresence>
        <MotionMenuItems
          anchor={{ to: "bottom", gap: 8, padding: 16 }}
          initial={{ opacity: 0, scale: 0.96, y: -4, filter: "blur(6px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.98, y: -3, filter: "blur(4px)" }}
          transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.75 }}
          className={cn(
            "z-50 w-48 overflow-hidden rounded-2xl border border-white/45 bg-card/82 py-1.5 shadow-lg backdrop-blur-2xl focus:outline-none dark:border-white/10 dark:bg-card/84",
            align === "end" ? "origin-top-right" : "origin-top-left",
            className
          )}
        >
          {children}
        </MotionMenuItems>
      </AnimatePresence>
    </Portal>
  );
}

// Dropdown Item
interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
  className?: string;
}

export function DropdownItem({
  children,
  onClick,
  variant = "default",
  disabled = false,
  className,
}: DropdownItemProps) {
  const baseStyles =
    "w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] transition-colors text-left";
  const variantStyles = {
    default: "text-foreground",
    destructive: "text-destructive",
  };
  const focusStyles = {
    default: "bg-accent/80",
    destructive: "bg-destructive/10",
  };

  return (
    <MenuItem disabled={disabled}>
      {({ focus, disabled: isDisabled }) => (
        <button
          onClick={onClick}
          disabled={isDisabled}
          className={cn(
            baseStyles,
            variantStyles[variant],
            focus && focusStyles[variant],
            isDisabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          {children}
        </button>
      )}
    </MenuItem>
  );
}

// Dropdown Separator
interface DropdownSeparatorProps {
  className?: string;
}

export function DropdownSeparator({ className }: DropdownSeparatorProps) {
  return <div className={cn("my-1 border-t border-border", className)} />;
}

// Dropdown Label (non-interactive heading)
interface DropdownLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownLabel({ children, className }: DropdownLabelProps) {
  return (
    <div
      className={cn(
        "px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider",
        className
      )}
    >
      {children}
    </div>
  );
}
