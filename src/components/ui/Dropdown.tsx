import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Fragment } from "react";
import type { ReactNode } from "react";
import { cx } from "./utils";

export function Dropdown({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <MenuButton as={Fragment} data-open={open || undefined}>
            {label}
          </MenuButton>
          <MenuItems
            transition
            anchor={{ to: "bottom end", gap: 6, padding: 10 }}
            className="z-90 min-w-40 origin-top-right overflow-hidden rounded-[14px] border border-panel/45 bg-panel/72 p-1 text-[12px] font-medium text-ink shadow-overlay backdrop-blur-[28px] outline-none ring-1 ring-line-soft/70 transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 dark:border-tooltip-ink/10 dark:bg-panel-dark/72 dark:text-ink-dark dark:ring-line-soft-dark/80"
          >
            {children}
          </MenuItems>
        </>
      )}
    </Menu>
  );
}

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
            "group flex min-h-8 w-full items-center gap-2 rounded-[10px] border-0 bg-transparent px-2.5 py-1.5 text-left leading-none text-inherit outline-none  duration-300 transition-all hover:translate-x-0.5 hover:bg-hover/80 hover:text-ink focus-visible:ring-2 focus-visible:ring-focus-line dark:hover:bg-tooltip-ink/10 dark:hover:text-ink-dark dark:focus-visible:ring-focus-line-dark",
            focus &&
              "translate-x-0.5 bg-hover/80 text-ink dark:bg-tooltip-ink/10 dark:text-ink-dark",
          )}
          onClick={(event) => {
            event.stopPropagation();
            onClick?.();
          }}
          type="button"
        >
          {children}
        </button>
      )}
    </MenuItem>
  );
}
