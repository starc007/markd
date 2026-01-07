import { cn } from "../../lib/utils";

interface ToggleGroupProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{
    value: T;
    icon: React.ReactNode;
    title?: string;
  }>;
  className?: string;
}

export function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
  className,
}: ToggleGroupProps<T>) {
  return (
    <div
      className={cn(
        "flex items-center border border-border rounded-xl overflow-hidden",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "p-2.5 transition-colors",
            value === option.value
              ? "bg-accent"
              : "bg-background hover:bg-accent"
          )}
          title={option.title}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
