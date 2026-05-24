import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
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
      className="flex h-12 items-center justify-between bg-tabbar/85 px-2 backdrop-blur-[22px] dark:border-line-soft-dark dark:bg-tabbar-dark/80"
      data-tauri-drag-region
    >
      <div className="flex min-w-0 flex-1 items-end gap-1 self-end overflow-x-auto">
        {openNotes.length > 0 ? (
          openNotes.map((note) => {
            const active =
              activeNote?.meta.id === note.meta.id && view === "notes";
            return (
              <button
                key={note.meta.id}
                className={cx(
                  "group flex h-9 max-w-[220px] items-center gap-2 rounded-t-xl px-3 text-sm text-muted transition-colors dark:text-muted-dark",
                  active &&
                    " bg-tab-active text-ink dark:bg-tab-active-dark dark:text-ink-dark",
                )}
                onClick={() => openNote(note.meta.id)}
              >
                <span className="truncate">{note.meta.title}</span>
                <span
                  role="button"
                  tabIndex={0}
                  className="grid h-5 w-5 place-items-center rounded-md text-muted opacity-0 transition-opacity hover:bg-hover group-hover:opacity-100 dark:text-muted-dark dark:hover:bg-hover-dark"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeNote(note.meta.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      closeNote(note.meta.id);
                    }
                  }}
                  aria-label={`Close ${note.meta.title}`}
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={13}
                    color="currentColor"
                  />
                </span>
              </button>
            );
          })
        ) : (
          <div className="flex h-9 items-center px-3 text-sm font-medium text-muted dark:text-muted-dark">
            {fallbackTitle}
          </div>
        )}
      </div>

      <div className="w-2" />
    </header>
  );
}
