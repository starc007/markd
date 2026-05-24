import { Dialog, DialogPanel } from "@headlessui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  FileEditIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { cx } from "@/components/ui";
import { useWorkspaceStore } from "@/stores/workspace";

const MotionDialogPanel = motion.create(DialogPanel);

export function CommandBar() {
  const open = useWorkspaceStore((state) => state.commandOpen);
  const setOpen = useWorkspaceStore((state) => state.setCommandOpen);
  const manifest = useWorkspaceStore((state) => state.manifest);
  const openNote = useWorkspaceStore((state) => state.openNote);
  const createNote = useWorkspaceStore((state) => state.createNote);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        createNote();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [createNote, setOpen]);

  const results = useMemo(() => {
    const notes = manifest?.notes ?? [];
    if (!query.trim()) return notes.slice(0, 8);
    return notes
      .filter((note) => note.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);
  }, [manifest?.notes, query]);

  const actionCount = results.length + 1;

  useEffect(() => {
    if (!open) return;
    setSelectedIndex(0);
  }, [open, query]);

  const runSelected = () => {
    if (selectedIndex === 0) {
      createNote();
    } else {
      const note = results[selectedIndex - 1];
      if (note) openNote(note.id);
    }
    setOpen(false);
  };

  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % actionCount);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => (index - 1 + actionCount) % actionCount);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      runSelected();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          static
          open={open}
          onClose={() => setOpen(false)}
          className="relative z-70"
        >
          <motion.div
            className="fixed inset-0 bg-overlay-backdrop backdrop-blur-lg dark:bg-overlay-backdrop-dark"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="fixed inset-0 grid place-items-center p-5">
            <MotionDialogPanel
              initial={{ opacity: 0, scale: 0.97, y: 16, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.98, y: 10, filter: "blur(8px)" }}
              transition={{ type: "spring", stiffness: 460, damping: 36 }}
              className="w-[min(520px,100%)] overflow-hidden rounded-2xl border border-line bg-panel/95 p-1.5 text-ink shadow-overlay backdrop-blur-[22px] dark:border-line-dark dark:bg-tooltip dark:text-tooltip-ink"
            >
              <div className="flex items-center gap-2  px-2.5 pb-2.5 pt-2 dark:border-tooltip-ink/10">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={16}
                  color="currentColor"
                />
                <input
                  autoFocus
                  className="h-8 w-full border-0 bg-transparent text-sm text-inherit outline-none placeholder:text-muted dark:placeholder:text-tooltip-ink/45"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Search notes..."
                />
              </div>
              <div className="mt-1 max-h-[320px] overflow-y-auto">
                <button
                  className={cx(
                    "relative flex w-full items-center gap-2 rounded-xl border-0 bg-transparent px-2 py-1.5 text-left text-sm transition-colors hover:bg-hover dark:hover:bg-tooltip-ink/10",
                    selectedIndex === 0 &&
                      "bg-hover text-ink dark:bg-tooltip-ink/10 dark:text-tooltip-ink",
                  )}
                  onClick={() => {
                    createNote();
                    setOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(0)}
                  type="button"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-panel-soft dark:bg-tooltip-ink/10">
                    <HugeiconsIcon
                      icon={Add01Icon}
                      size={15}
                      color="currentColor"
                    />
                  </span>
                  <span className="font-medium">Create note</span>
                  <kbd className="ml-auto text-[11px] text-muted dark:text-tooltip-ink/55">
                    ⌘N
                  </kbd>
                </button>
                {results.map((note, index) => (
                  <button
                    key={note.id}
                    className={cx(
                      "relative flex w-full items-center gap-2 rounded-xl border-0 bg-transparent px-2 py-1.5 text-left text-sm transition-colors hover:bg-hover dark:hover:bg-tooltip-ink/10",
                      selectedIndex === index + 1 &&
                        "bg-hover text-ink dark:bg-tooltip-ink/10 dark:text-tooltip-ink",
                    )}
                    onClick={() => {
                      openNote(note.id);
                      setOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index + 1)}
                    type="button"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-panel-soft dark:bg-tooltip-ink/10">
                      <HugeiconsIcon
                        icon={FileEditIcon}
                        size={15}
                        color="currentColor"
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {note.title}
                    </span>
                    <small className="ml-auto max-w-[38%] truncate text-[11px] text-muted dark:text-tooltip-ink/55">
                      {note.path}
                    </small>
                  </button>
                ))}
                {results.length === 0 && (
                  <div className="px-3 py-8 text-center text-sm text-muted dark:text-tooltip-ink/55">
                    No notes found
                  </div>
                )}
              </div>
            </MotionDialogPanel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
