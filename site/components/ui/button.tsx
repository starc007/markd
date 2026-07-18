"use client";

import { type HTMLMotionProps, motion, useReducedMotion } from "motion/react";
import { forwardRef, type ReactNode } from "react";
import { SPRING_PRESS } from "@/lib/ease";
import { useHoverCapable } from "@/lib/hooks/use-hover-capable";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "border border-border-strong bg-card text-foreground hover:bg-hover",
  outline: "border border-border-strong bg-transparent text-foreground hover:bg-hover",
  ghost: "text-muted-foreground hover:text-foreground",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 rounded-full px-4 text-[13px]",
  md: "h-11 gap-2 rounded-full px-5 text-[14px]",
  lg: "h-12 gap-2 rounded-full px-6 text-[15px]",
};

export interface ButtonLinkProps extends Omit<HTMLMotionProps<"a">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
}

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className, children, ...rest },
    ref,
  ) {
    const reduce = useReducedMotion();
    const canHover = useHoverCapable();
    return (
      <motion.button
        ref={ref}
        className={cn(
          "inline-flex select-none items-center justify-center font-medium transition-colors disabled:pointer-events-none disabled:opacity-55",
          VARIANT[variant],
          SIZE[size],
          className,
        )}
        whileTap={reduce || rest.disabled ? undefined : { scale: 0.98 }}
        whileHover={reduce || !canHover || rest.disabled ? undefined : { scale: 1.01 }}
        transition={SPRING_PRESS}
        {...rest}
      >
        {children}
      </motion.button>
    );
  },
);

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  function ButtonLink(
    { variant = "primary", size = "md", className, children, ...rest },
    ref,
  ) {
    const reduce = useReducedMotion();
    const canHover = useHoverCapable();
    return (
      <motion.a
        ref={ref}
        className={cn(
          "inline-flex select-none items-center justify-center font-medium transition-colors",
          VARIANT[variant],
          SIZE[size],
          className,
        )}
        whileTap={reduce ? undefined : { scale: 0.98 }}
        whileHover={reduce || !canHover ? undefined : { scale: 1.01 }}
        transition={SPRING_PRESS}
        {...rest}
      >
        {children}
      </motion.a>
    );
  },
);
