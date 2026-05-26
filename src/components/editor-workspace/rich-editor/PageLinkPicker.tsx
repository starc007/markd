import { FileEditIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { NoteRecord } from "@/lib/types";

export interface PagePickerState {
  query?: string;
  range: {
    from: number;
    to: number;
  };
  position: {
    left: number;
    top: number;
  };
  side: "top" | "bottom";
}

export function PageLinkPicker({
  notes,
  picker,
  onClose,
  onSelect,
}: {
  notes: NoteRecord[];
  picker: PagePickerState | null;
  onClose: () => void;
  onSelect: (title: string) => void;
}) {
  const query = picker?.query?.trim().toLowerCase() ?? "";
  const results = notes
    .filter((note) => !query || note.title.toLowerCase().includes(query))
    .slice(0, 10);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setActiveIndex(-1);
  }, [picker]);

  useEffect(() => {
    if (!picker) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) =>
          Math.min(index + 1, Math.max(results.length - 1, 0)),
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          onSelect(results[activeIndex].title);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [activeIndex, onClose, onSelect, picker, results]);

  return (
    <AnimatePresence>
      {picker && (
        <>
          <button
            aria-label="Close page picker"
            className="fixed inset-0 z-70 cursor-default bg-transparent"
            onClick={onClose}
            type="button"
          />
          <motion.div
            animate={{ scale: 1, y: 0 }}
            className="fixed z-80 w-[248px] overflow-hidden rounded-2xl border border-line bg-panel/95 p-1 text-ink shadow-overlay backdrop-blur-[22px] dark:border-line-dark dark:bg-tooltip dark:text-tooltip-ink"
            exit={{ scale: 0.98, y: picker.side === "bottom" ? -6 : 6 }}
            initial={{ scale: 0.98, y: picker.side === "bottom" ? -6 : 6 }}
            style={{
              left: picker.position.left,
              top: picker.position.top,
              transformOrigin: picker.side === "bottom" ? "top left" : "bottom left",
            }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-2 pb-1 pt-1 text-[10px] font-medium uppercase tracking-wide text-muted dark:text-tooltip-ink/60">
              Pages
            </div>
            <div className="max-h-56 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {results.map((note, index) => (
                <button
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm transition-[background-color,color,transform] duration-150 hover:translate-x-0.5 hover:bg-hover data-[active=true]:translate-x-0.5 data-[active=true]:bg-hover dark:hover:bg-tooltip-ink/10 dark:data-[active=true]:bg-tooltip-ink/10"
                  data-active={results[activeIndex]?.id === note.id}
                  key={note.id}
                  onClick={() => onSelect(note.title)}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  type="button"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-panel-soft dark:bg-tooltip-ink/10">
                    <HugeiconsIcon icon={FileEditIcon} size={15} color="currentColor" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{note.title}</span>
                </button>
              ))}
              {results.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted dark:text-tooltip-ink/55">
                  No pages yet
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
