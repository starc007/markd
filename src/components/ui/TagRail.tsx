import { X } from "lucide-react";
import { motion } from "motion/react";
import { useId } from "react";
import { SPRING_LAYOUT } from "@/lib/ease";
import { tagColor } from "@/lib/tagColor";
import { cx } from "@/lib/utils";

/** Left filter rail: "All" + registry tags, with a gliding active pill. */
export function TagRail({
  tags,
  activeTag,
  onSelect,
  onDelete,
}: {
  tags: string[];
  activeTag: string | null;
  onSelect: (tag: string | null) => void;
  onDelete: (tag: string) => void;
}) {
  const pillId = useId();

  return (
    <aside className="sticky top-0 hidden w-[152px] shrink-0 sm:block">
      <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
        Tags
      </p>
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cx(
            "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
            activeTag === null
              ? "text-ink"
              : "text-muted hover:bg-hover hover:text-ink",
          )}
        >
          {activeTag === null && (
            <motion.span
              layoutId={pillId}
              transition={SPRING_LAYOUT}
              className="absolute inset-0 rounded-md bg-active"
            />
          )}
          <span className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full border border-faint" />
          <span className="relative z-10 truncate">All</span>
        </button>

        {tags.map((tag) => {
          const active = activeTag === tag;
          return (
            <div key={tag} className="group/rail flex items-center">
              <button
                type="button"
                onClick={() => onSelect(active ? null : tag)}
                className={cx(
                  "relative flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
                  active ? "text-ink" : "text-muted hover:bg-hover hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId={pillId}
                    transition={SPRING_LAYOUT}
                    className="absolute inset-0 rounded-md bg-active"
                  />
                )}
                <span
                  className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tagColor(tag) }}
                />
                <span className="relative z-10 truncate">{tag}</span>
              </button>
              <button
                type="button"
                aria-label={`Delete tag ${tag}`}
                onClick={() => onDelete(tag)}
                className="grid h-6 w-6 shrink-0 place-items-center rounded text-faint opacity-0 transition-opacity hover:text-danger group-hover/rail:opacity-100"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>

      {tags.length === 0 && (
        <p className="mt-1 px-2 text-[12px] leading-relaxed text-faint">
          Create a tag from the top bar to start filtering.
        </p>
      )}
    </aside>
  );
}
