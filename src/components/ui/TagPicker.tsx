import { Check, Tag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { EASE_OUT } from "@/lib/ease";
import { tagColor } from "@/lib/tagColor";
import { Tooltip } from "@/components/ui/Tooltip";

/** Dropdown to toggle which registry tags are assigned to an item. */
export function TagPicker({
  assigned,
  registry,
  onChange,
}: {
  assigned: string[];
  registry: string[];
  onChange: (tags: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = (tag: string) =>
    onChange(
      assigned.includes(tag)
        ? assigned.filter((t) => t !== tag)
        : [...assigned, tag],
    );

  return (
    <div
      ref={ref}
      className="relative"
      onClick={(event) => event.stopPropagation()}
    >
      <Tooltip label="Assign tags" side="top">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="grid h-7 w-7 place-items-center rounded-md text-faint transition-colors duration-100 hover:bg-active hover:text-ink"
        >
          <Tag size={13} strokeWidth={2} />
        </button>
      </Tooltip>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.14, ease: EASE_OUT }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-8 z-50 max-h-64 w-48 overflow-y-auto rounded-lg border border-line bg-bg p-1 shadow-lg shadow-black/8 dark:shadow-black/40"
          >
            {registry.length === 0 ? (
              <p className="px-2 py-2 text-[12px] leading-relaxed text-faint">
                No tags yet. Create one from the top bar.
              </p>
            ) : (
              registry.map((tag) => {
                const on = assigned.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggle(tag)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-hover"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: tagColor(tag) }}
                    />
                    <span className="min-w-0 flex-1 truncate text-left text-ink">
                      {tag}
                    </span>
                    {on && (
                      <Check size={13} strokeWidth={2.5} className="shrink-0 text-ink" />
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
