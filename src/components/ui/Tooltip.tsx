import { motion } from "motion/react";
import type { ReactNode } from "react";

export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="relative inline-flex">
      {children}
      <motion.span initial={false} className="hidden">
        {label}
      </motion.span>
    </span>
  );
}
