import { forwardRef } from "react";
import { cn } from "../../lib/utils";

type IconButtonVariant = "ghost" | "filled" | "outline";
type IconButtonSize = "sm" | "md" | "lg";

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  children: React.ReactNode;
}

const variantStyles: Record<IconButtonVariant, string> = {
  ghost: "hover:bg-accent text-muted-foreground hover:text-foreground",
  filled: "bg-accent text-foreground",
  outline:
    "border border-border hover:bg-accent text-muted-foreground hover:text-foreground",
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-2.5",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "ghost", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg transition-colors",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
