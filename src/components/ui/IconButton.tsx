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
        "inline-flex h-[34px] w-[34px] items-center justify-center rounded-[14px] border border-[#dedbd3] bg-transparent transition-colors hover:bg-[#e9eee6] dark:border-[#34322e] dark:hover:bg-[#2a3029]",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
