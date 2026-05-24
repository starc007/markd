import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  CheckmarkCircle01Icon,
  FolderIcon,
  MoreVerticalIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { Button, Dropdown, DropdownItem, IconButton } from "@/components/ui";
import { useWorkspaceStore } from "@/stores/workspace";

export function TopBar() {
  const saving = useWorkspaceStore((state) => state.saving);
  const activeNote = useWorkspaceStore((state) => state.activeNote);
  const view = useWorkspaceStore((state) => state.view);
  const createNote = useWorkspaceStore((state) => state.createNote);
  const createFolder = useWorkspaceStore((state) => state.createFolder);
  const setCommandOpen = useWorkspaceStore((state) => state.setCommandOpen);
  const title = activeNote?.meta.title ?? {
    notes: "Workspace",
    todos: "Tasks",
    stickies: "Sticky notes",
    bookmarks: "Bookmarks",
    settings: "Settings",
  }[view];

  return (
    <header
      className="flex h-14 items-center justify-between border-b border-line-soft dark:border-line-soft-dark bg-panel/70 dark:bg-panel-dark/70 px-5 backdrop-blur-[22px]"
      data-tauri-drag-region
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <strong className="truncate text-sm font-semibold">{title}</strong>
        <span className="hidden text-sm text-muted dark:text-muted-dark sm:inline">/ Draft</span>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="hidden items-center gap-1.5 text-xs text-muted dark:text-muted-dark sm:flex">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} color="currentColor" />
          {saving ? "Saving" : "Saved"}
        </span>
        <IconButton onClick={() => setCommandOpen(true)} aria-label="Search">
          <HugeiconsIcon icon={Search01Icon} size={17} color="currentColor" />
        </IconButton>
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
