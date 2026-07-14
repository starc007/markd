import { Folder, FolderOpen } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { EASE_IN_OUT } from "@/lib/ease";
import { cx } from "@/lib/utils";

export function FolderMorphIcon({
  open,
  className,
}: {
  open: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const transition = reduce
    ? { duration: 0 }
    : { duration: 0.14, ease: EASE_IN_OUT };

  return (
    <span
      aria-hidden="true"
      className={cx("relative inline-block", className)}
    >
      <motion.span
        initial={false}
        animate={{
          opacity: open ? 0 : 1,
          transform: open
            ? "scale(0.88) rotate(-3deg)"
            : "scale(1) rotate(0deg)",
          filter: open ? "blur(1.5px)" : "blur(0px)",
        }}
        transition={transition}
        className="absolute inset-0"
      >
        <Folder className="h-full w-full" strokeWidth={1.75} />
      </motion.span>
      <motion.span
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          transform: open
            ? "scale(1) rotate(0deg)"
            : "scale(0.88) rotate(3deg)",
          filter: open ? "blur(0px)" : "blur(1.5px)",
        }}
        transition={transition}
        className="absolute inset-0"
      >
        <FolderOpen className="h-full w-full" strokeWidth={1.75} />
      </motion.span>
    </span>
  );
}
