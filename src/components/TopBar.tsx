import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useWorkspaceStore } from "@/stores/workspace";
import { cx } from "@/components/ui";

export function TopBar() {
  const activeNote = useWorkspaceStore((state) => state.activeNote);
  const openNotes = useWorkspaceStore((state) => state.openNotes);
  const view = useWorkspaceStore((state) => state.view);
  const openNote = useWorkspaceStore((state) => state.openNote);
  const closeNote = useWorkspaceStore((state) => state.closeNote);
  const fallbackTitle = {
    notes: "Workspace",
    todos: "Tasks",
    stickies: "Sticky notes",
    bookmarks: "Bookmarks",
    settings: "Settings",
  }[view];

  return (
    <header
      className="relative z-80 flex h-12 min-h-12 shrink-0 items-end justify-between overflow-hidden bg-tabbar/95 px-2 backdrop-blur-[22px] dark:bg-tabbar-dark/95"
      data-tauri-drag-region
    >
      <div
        className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-tauri-drag-region
      >
        {openNotes.length > 0 ? (
          <AnimatePresence initial={false}>
            {openNotes.map((note) => {
              const active =
                activeNote?.meta.id === note.meta.id && view === "notes";
              return (
                <motion.div
                  animate={{ scale: 1, y: 0 }}
                  className={cx(
                    "group relative flex h-9 max-w-[220px] shrink-0 items-center overflow-hidden rounded-t-xl text-sm text-muted dark:text-muted-dark",
                    active && "text-ink dark:text-ink-dark",
                  )}
                  exit={{ scale: 0.98, y: 4 }}
                  initial={{ scale: 0.98, y: 4 }}
                  key={note.meta.id}
                  layout
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  {active && (
                    <motion.div
                      className="absolute inset-0 rounded-t-xl bg-tab-active dark:bg-tab-active-dark"
                      layoutId="active-top-tab"
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                  <button
                    className="relative z-10 flex h-full min-w-0 flex-1 items-center px-3 pr-1 text-left outline-none transition-[color,transform] duration-150 hover:translate-y-[-1px] focus-visible:ring-2 focus-visible:ring-focus-line dark:focus-visible:ring-focus-line-dark"
                    onClick={() => openNote(note.meta.id)}
                    type="button"
                  >
                    <span className="truncate">{note.meta.title}</span>
                  </button>
                  <button
                    aria-label={`Close ${note.meta.title}`}
                    className="relative z-10 mr-1 grid h-6 w-6 shrink-0 place-items-center rounded-lg text-muted opacity-0 transition-[background-color,color,opacity,transform] duration-150 hover:scale-[1.04] hover:bg-hover hover:text-ink group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-line dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark dark:focus-visible:ring-focus-line-dark"
                    onClick={(event) => {
                      event.stopPropagation();
                      closeNote(note.meta.id);
                    }}
                    type="button"
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      size={13}
                      color="currentColor"
                    />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <motion.div
            animate={{ y: 0 }}
            className="flex h-9 items-center px-3 text-sm font-medium text-muted dark:text-muted-dark"
            initial={{ y: 4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {fallbackTitle}
          </motion.div>
        )}
      </div>

      <div className="w-2" />
    </header>
  );
}
