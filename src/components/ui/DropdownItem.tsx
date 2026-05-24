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
            "relative flex w-full items-center gap-2.5 rounded-[13px] border-0 bg-transparent p-2.5 text-left hover:bg-hover",
            focus && "bg-hover",
          )}
          onClick={onClick}
        >
          {children}
        </button>
      )}
    </MenuItem>
  );
}
