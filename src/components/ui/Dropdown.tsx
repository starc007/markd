import { Menu, MenuButton, MenuItems } from "@headlessui/react";
import { AnimatePresence, motion } from "motion/react";
import { Fragment } from "react";
import type { ReactNode } from "react";

const MotionMenuItems = motion.create(MenuItems);

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
          <AnimatePresence>
            {open && (
              <MotionMenuItems
                static
                anchor={{ to: "bottom end", gap: 6, padding: 10 }}
                initial={{
                  opacity: 0,
                  scale: 0.97,
                  y: -3,
                  filter: "blur(8px)",
                }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.98, y: -3, filter: "blur(6px)" }}
                transition={{ type: "spring", stiffness: 560, damping: 42 }}
                className="z-90 min-w-36 rounded-xl border border-line bg-panel/95 p-1 text-[12px] font-medium text-ink shadow-overlay backdrop-blur-[22px] dark:border-line-dark dark:bg-tooltip dark:text-tooltip-ink"
              >
                {children}
              </MotionMenuItems>
            )}
          </AnimatePresence>
        </>
      )}
    </Menu>
  );
}
