import { FileEditIcon, NoteAddIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { cx } from "@/components/ui";
import type { NoteRecord } from "@/lib/types";

export function PageLinkPicker({
  notes,
  open,
  onClose,
  onSelect,
}: {
  notes: NoteRecord[];
  open: boolean;
  onClose: () => void;
  onSelect: (title: string) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return notes.slice(0, 8);
    return notes
      .filter((note) => note.title.toLowerCase().includes(normalized))
      .slice(0, 8);
  }, [notes, query]);
  const canCreate =
    query.trim().length > 0 &&
    !notes.some((note) => note.title.toLowerCase() === query.trim().toLowerCase());

  return (
    <AnimatePresence>
      {open && (
        <>
          <button
            aria-label="Close page picker"
            className="fixed inset-0 z-70 cursor-default bg-transparent"
            onClick={onClose}
            type="button"
          />
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed left-1/2 top-[28%] z-80 w-[min(340px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-panel/95 p-1.5 text-ink shadow-overlay backdrop-blur-[22px] dark:border-line-dark dark:bg-tooltip dark:text-tooltip-ink"
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-2 px-2.5 py-2">
              <HugeiconsIcon icon={Search01Icon} size={15} color="currentColor" />
              <input
                autoFocus
                className="h-8 w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted dark:placeholder:text-tooltip-ink/45"
                placeholder="Search pages..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") onClose();
                  if (event.key === "Enter") {
                    const title = results[0]?.title ?? query.trim();
                    if (title) onSelect(title);
                  }
                }}
              />
            </div>
            <div className="max-h-64 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {results.map((note) => (
                <button
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm transition-colors hover:bg-hover dark:hover:bg-tooltip-ink/10"
                  key={note.id}
                  onClick={() => onSelect(note.title)}
                  type="button"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-panel-soft dark:bg-tooltip-ink/10">
                    <HugeiconsIcon icon={FileEditIcon} size={15} color="currentColor" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{note.title}</span>
                </button>
              ))}
              {canCreate && (
                <button
                  className={cx(
                    "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm transition-colors hover:bg-hover dark:hover:bg-tooltip-ink/10",
                  )}
                  onClick={() => onSelect(query.trim())}
                  type="button"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-panel-soft dark:bg-tooltip-ink/10">
                    <HugeiconsIcon icon={NoteAddIcon} size={15} color="currentColor" />
                  </span>
                  <span className="font-medium">Create "{query.trim()}"</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
