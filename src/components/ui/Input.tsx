import { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, className, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full bg-background border border-border rounded-xl text-sm placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all",
            icon ? "pl-10 pr-4 py-2.5" : "px-4 py-2.5",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
