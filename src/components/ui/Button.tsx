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
    soft: "border-[#dedbd3] bg-transparent hover:bg-[#e9eee6] dark:border-[#34322e] dark:hover:bg-[#2a3029]",
    primary:
      "border-[#191817] bg-[#191817] text-[#f6f5f2] hover:bg-[#2a2926] dark:border-[#f4f1ea] dark:bg-[#f4f1ea] dark:text-[#171716]",
    ghost:
      "border-transparent bg-transparent hover:bg-[#e9eee6] dark:hover:bg-[#2a3029]",
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
