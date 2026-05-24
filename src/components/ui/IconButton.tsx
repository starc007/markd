import { motion, type HTMLMotionProps } from "motion/react";
import { cx } from "./utils";

export function IconButton({
  children,
  className,
  ...props
}: HTMLMotionProps<"button">) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      className={cx(
        "inline-flex h-[34px] w-[34px] items-center justify-center rounded-[14px] border border-line bg-transparent transition-colors hover:bg-hover dark:border-line-dark dark:hover:bg-hover-dark",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
