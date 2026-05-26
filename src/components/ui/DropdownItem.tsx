import { MenuItem } from "@headlessui/react";
import type { ReactNode } from "react";
import { cx } from "./utils";

export function DropdownItem({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <MenuItem>
      {({ focus }) => (
        <button
          className={cx(
            "relative flex w-full items-center gap-2 rounded-lg border-0 bg-transparent px-2 py-1.5 text-left leading-none text-inherit hover:bg-hover dark:hover:bg-tooltip-ink/10",
            focus && "bg-hover dark:bg-tooltip-ink/10",
          )}
          onClick={(event) => {
            event.stopPropagation();
            onClick?.();
          }}
        >
          {children}
        </button>
      )}
    </MenuItem>
  );
}
