import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-9 w-full rounded-lg border border-line-soft bg-panel px-3 text-[12.5px] text-ink outline-none",
        "transition-[border-color,box-shadow,background-color] duration-100 placeholder:text-faint",
        "focus-visible:border-ink/40 focus-visible:ring-2 focus-visible:ring-ink/10",
        "aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/10",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
