import { Menu, MenuButton, MenuItems } from "@headlessui/react";
import { AnimatePresence, motion } from "motion/react";
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
      <MenuButton as="div">{label}</MenuButton>
      <AnimatePresence>
        <MotionMenuItems
          anchor={{ to: "bottom end", gap: 8, padding: 12 }}
          initial={{ opacity: 0, scale: 0.97, y: -4, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.98, y: -4, filter: "blur(6px)" }}
          transition={{ type: "spring", stiffness: 520, damping: 40 }}
          className="z-80 rounded-[22px] border border-line bg-panel/85 p-1.5 shadow-overlay backdrop-blur-[22px]"
        >
          {children}
        </MotionMenuItems>
      </AnimatePresence>
    </Menu>
  );
}
