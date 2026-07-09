import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Property } from "@/lib/frontmatter";
import { EASE_OUT } from "@/lib/ease";
import { cx, hostOf } from "@/lib/utils";

/**
 * Read-only properties panel for a note's frontmatter. Renders
 * scalars as text (URLs as links), lists as chips. Collapsible; the raw YAML
 * itself lives in the file, untouched.
 */
export function NoteProperties({ properties }: { properties: Property[] }) {
  const [open, setOpen] = useState(true);
  if (properties.length === 0) return null;

  return (
    <div className="mb-5 mt-1 border-b border-line pb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint transition-colors hover:text-muted"
      >
        <ChevronRight
          size={12}
          strokeWidth={2.5}
          className={cx("transition-transform duration-150", open && "rotate-90")}
        />
        Properties
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 pt-1">
              {properties.map((property) => (
                <div
                  key={property.key}
                  className="flex items-start gap-3 py-0.5 text-[12.5px]"
                >
                  <span className="w-24 shrink-0 truncate capitalize text-faint">
                    {property.key}
                  </span>
                  <div className="min-w-0 flex-1">
                    <PropertyValue value={property.value} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PropertyValue({ value }: { value: string | string[] }) {
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, index) => (
          <span
            key={index}
            className="rounded-full bg-hover px-2 py-0.5 text-[11.5px] leading-none text-muted"
          >
            {item}
          </span>
        ))}
      </div>
    );
  }
  if (/^https?:\/\//i.test(value)) {
    return (
      <a
        href={value}
        className="truncate text-ink underline decoration-line underline-offset-2 hover:decoration-ink"
        title={value}
      >
        {hostOf(value)}
      </a>
    );
  }
  return <span className="text-ink">{value}</span>;
}
