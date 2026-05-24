import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Cancel01Icon,
  FolderIcon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { Button, Dropdown, DropdownItem, IconButton } from "@/components/ui";
import { useWorkspaceStore } from "@/stores/workspace";
import { cx } from "@/components/ui";

export function TopBar() {
  const activeNote = useWorkspaceStore((state) => state.activeNote);
  const openNotes = useWorkspaceStore((state) => state.openNotes);
  const view = useWorkspaceStore((state) => state.view);
  const createNote = useWorkspaceStore((state) => state.createNote);
  const createFolder = useWorkspaceStore((state) => state.createFolder);
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
      className="flex h-12 items-center justify-between border-b border-line-soft bg-panel/70 px-2 backdrop-blur-[22px] dark:border-line-soft-dark dark:bg-panel-dark/70"
      data-tauri-drag-region
    >
      <div className="flex min-w-0 flex-1 items-end gap-1 self-end overflow-x-auto">
        {openNotes.length > 0 ? (
          openNotes.map((note) => {
            const active = activeNote?.meta.id === note.meta.id && view === "notes";
            return (
              <button
                key={note.meta.id}
                className={cx(
                  "group flex h-9 max-w-[220px] items-center gap-2 rounded-t-xl border border-transparent px-3 text-sm text-muted transition-colors hover:bg-hover dark:text-muted-dark dark:hover:bg-hover-dark",
                  active &&
                    "border-line-soft bg-canvas text-ink dark:border-line-soft-dark dark:bg-canvas-dark dark:text-ink-dark",
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
                  <HugeiconsIcon icon={Cancel01Icon} size={13} color="currentColor" />
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

      <div className="flex items-center gap-2.5">
        <Button onClick={() => createNote()} variant="primary">
          <HugeiconsIcon icon={Add01Icon} size={15} color="currentColor" />
          Note
        </Button>
        <Dropdown
          label={
            <IconButton aria-label="More">
              <HugeiconsIcon icon={MoreVerticalIcon} size={17} color="currentColor" />
            </IconButton>
          }
        >
          <DropdownItem onClick={() => createFolder()}>
            <HugeiconsIcon icon={FolderIcon} size={15} color="currentColor" />
            New folder
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
