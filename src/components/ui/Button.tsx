import { motion, type HTMLMotionProps } from "motion/react";
import { cx } from "./utils";

export function Button({
  children,
  variant = "soft",
  className,
  ...props
}: HTMLMotionProps<"button"> & {
  variant?: "soft" | "primary" | "ghost";
}) {
  const variantClass = {
    soft: "border-line bg-transparent hover:bg-hover dark:border-line-dark dark:hover:bg-hover-dark",
    primary:
      "border-ink bg-ink text-canvas hover:bg-primary-hover dark:border-ink-dark dark:bg-ink-dark dark:text-canvas-dark dark:hover:bg-primary-hover-dark",
    ghost:
      "border-transparent bg-transparent hover:bg-hover dark:hover:bg-hover-dark",
  }[variant];

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cx(
        "inline-flex min-h-[34px] items-center justify-center gap-2 rounded-[14px] border px-3 text-sm transition-colors",
        variantClass,
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
