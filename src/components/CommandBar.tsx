import { Dialog, DialogPanel } from "@headlessui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, FileEditIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace";

const MotionDialogPanel = motion.create(DialogPanel);

export function CommandBar() {
  const open = useWorkspaceStore((state) => state.commandOpen);
  const setOpen = useWorkspaceStore((state) => state.setCommandOpen);
  const manifest = useWorkspaceStore((state) => state.manifest);
  const openNote = useWorkspaceStore((state) => state.openNote);
  const createNote = useWorkspaceStore((state) => state.createNote);
  const [query, setQuery] = useState("");

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

  return (
    <AnimatePresence>
      {open && (
        <Dialog static open={open} onClose={() => setOpen(false)} className="relative z-70">
          <motion.div
            className="fixed inset-0 bg-overlay-backdrop dark:bg-overlay-backdrop-dark backdrop-blur-lg"
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
              className="w-[min(680px,100%)] rounded-[22px] border border-line dark:border-line-dark bg-panel/85 dark:bg-panel-dark/85 p-2.5 shadow-overlay backdrop-blur-[22px]"
            >
              <div className="flex items-center gap-2.5 border-b border-line dark:border-line-dark px-2.5 pb-3 pt-2">
                <HugeiconsIcon icon={Search01Icon} size={18} color="currentColor" />
                <input
                  autoFocus
                  className="h-[38px] w-full border-0 bg-transparent outline-none"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find or create..."
                />
              </div>
              <button
                className="relative mt-2 flex w-full items-center gap-2.5 rounded-[13px] border-0 bg-transparent p-2.5 text-left transition-colors hover:bg-hover dark:hover:bg-hover-dark"
                onClick={() => {
                  createNote();
                  setOpen(false);
                }}
              >
                <HugeiconsIcon icon={Add01Icon} size={18} color="currentColor" />
                Create note
                <kbd className="ml-auto text-xs text-muted dark:text-muted-dark">⌘N</kbd>
              </button>
              {results.map((note) => (
                <button
                  key={note.id}
                  className="relative flex w-full items-center gap-2.5 rounded-[13px] border-0 bg-transparent p-2.5 text-left transition-colors hover:bg-hover dark:hover:bg-hover-dark"
                  onClick={() => {
                    openNote(note.id);
                    setOpen(false);
                  }}
                >
                  <HugeiconsIcon icon={FileEditIcon} size={18} color="currentColor" />
                  {note.title}
                  <small className="ml-auto max-w-[42%] truncate text-muted dark:text-muted-dark">{note.path}</small>
                </button>
              ))}
            </MotionDialogPanel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
