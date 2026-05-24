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
    soft: "border-line bg-transparent hover:bg-hover",
    primary:
      "border-ink bg-ink text-canvas hover:bg-press",
    ghost:
      "border-transparent bg-transparent hover:bg-hover",
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
