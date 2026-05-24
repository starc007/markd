import { FileEditIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export function Board({
  title,
  icon,
  children,
}: {
  title: string;
  icon: typeof FileEditIcon;
  children: ReactNode;
}) {
  return (
    <motion.main
      className="overflow-auto bg-panel dark:bg-panel-dark p-[clamp(32px,6vw,72px)]"
      initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
    >
      <div className="mb-6 flex items-center gap-2.5">
        <HugeiconsIcon icon={icon} size={22} color="currentColor" />
        <h1 className="m-0 text-2xl font-semibold">{title}</h1>
      </div>
      {children}
    </motion.main>
  );
}
