import { motion } from "motion/react";
import { cx } from "./utils";

export interface AnimatedTabItem {
  id: string;
  label: string;
  count?: number;
}

export function AnimatedTabs({
  items,
  value,
  onChange,
  className,
}: {
  items: AnimatedTabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl bg-panel-soft/70 p-1 [scrollbar-width:none] dark:bg-panel-soft-dark/70 [&::-webkit-scrollbar]:hidden",
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const selected = item.id === value;

        return (
          <button
            aria-selected={selected}
            className={cx(
              "relative h-8 shrink-0 rounded-xl px-2.5 text-xs font-medium text-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-focus-line/40 dark:text-muted-dark dark:hover:text-ink-dark dark:focus-visible:ring-focus-line-dark/40",
              selected && "text-ink dark:text-ink-dark",
            )}
            key={item.id}
            onClick={() => onChange(item.id)}
            role="tab"
            type="button"
          >
            {selected && (
              <motion.span
                className="absolute inset-0 rounded-xl bg-panel dark:bg-panel-dark"
                layoutId="animated-tab-indicator"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              <span className="max-w-[160px] truncate">{item.label}</span>
              {typeof item.count === "number" && (
                <span className="rounded-full bg-hover px-1.5 py-0.5 text-[10px] leading-none text-muted dark:bg-hover-dark dark:text-muted-dark">
                  {item.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
