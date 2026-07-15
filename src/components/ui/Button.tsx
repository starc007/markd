import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";
import { SPRING_PRESS } from "@/lib/ease";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANT: Record<Variant, string> = {
  primary: "bg-invert text-invert-ink hover:opacity-90",
  secondary: "bg-hover text-ink border border-line",
  outline: "border border-line text-ink hover:bg-hover",
  ghost: "text-muted hover:bg-hover hover:text-ink",
  danger: "text-danger hover:bg-danger/10",
};

const SIZE: Record<Size, string> = {
  sm: "h-7 gap-1.5 rounded-md px-2.5 text-[12.5px]",
  md: "h-9 gap-2 rounded-lg px-4 text-[13.5px]",
  lg: "h-11 gap-2.5 rounded-lg px-5 text-[14.5px]",
  icon: "h-7 w-7 rounded-md",
};

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "secondary", size = "md", className, disabled, ...rest },
    ref,
  ) => {
    const reduce = useReducedMotion();
    return (
      <motion.button
        ref={ref}
        type="button"
        disabled={disabled}
        whileTap={reduce || disabled ? undefined : { scale: 0.96 }}
        transition={SPRING_PRESS}
        className={cn(
          "flex select-none items-center justify-center font-medium transition-colors duration-100",
          "disabled:pointer-events-none disabled:opacity-50",
          VARIANT[variant],
          SIZE[size],
          className,
        )}
        {...rest}
      />
    );
  },
);

Button.displayName = "Button";
