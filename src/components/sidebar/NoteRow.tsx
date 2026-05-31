import {
  FileEditIcon,
  FolderAddIcon,
  FolderIcon,
  MoreHorizontalIcon,
  NoteAddIcon,
  NoteRemoveIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cx, Dropdown, DropdownItem } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import type { NoteRecord } from "@/lib/types";

export function NoteRow({
  note,
  active,
  onCreateFolder,
  onCreateNote,
  onDelete,
  onMove,
  onOpen,
}: {
  note: NoteRecord;
  active: boolean;
  onCreateFolder?: (note: NoteRecord) => void;
  onCreateNote?: (note: NoteRecord) => void;
  onDelete: (id: string) => void;
  onMove: (note: NoteRecord) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div
      className={cx(
        "group relative grid min-h-8 w-full grid-cols-[minmax(0,1fr)_42px_28px] items-center rounded-lg text-sm font-medium text-sidebar-ink-row transition-colors hover:bg-sidebar-active dark:text-sidebar-ink-row-dark dark:hover:bg-sidebar-active-dark",
        active &&
          "bg-sidebar-active text-sidebar-ink-strong dark:bg-sidebar-active-dark dark:text-sidebar-ink-strong-dark",
      )}
    >
      <button
        className="flex min-w-0 items-center gap-2 rounded-lg py-1.5 pl-2 pr-1 text-left"
        onClick={() => onOpen(note.id)}
        type="button"
      >
        <span className="shrink-0">
          <HugeiconsIcon icon={FileEditIcon} size={16} color="currentColor" />
        </span>
        <span className="min-w-0 flex-1 truncate">{note.title}</span>
      </button>
      <button
        className="min-w-0 py-1.5 text-right"
        onClick={() => onOpen(note.id)}
        type="button"
      >
        <small className="block truncate text-xs font-medium text-sidebar-ink-row-muted dark:text-sidebar-ink-row-muted-dark">
          {timeAgo(note.updatedAt)}
        </small>
      </button>
      <Dropdown
        label={
          <button
            aria-label={`Options for ${note.title}`}
            className="mx-1 grid h-6 w-6 place-items-center rounded-md text-sidebar-ink-muted opacity-0 transition-opacity hover:bg-sidebar-active hover:text-sidebar-ink-strong group-hover:opacity-100 data-[open]:opacity-100 dark:text-sidebar-ink-muted-dark dark:hover:bg-sidebar-active-dark dark:hover:text-sidebar-ink-strong-dark"
            onClick={(event) => event.stopPropagation()}
            type="button"
          >
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              size={15}
              color="currentColor"
            />
          </button>
        }
      >
        {onCreateNote && (
          <DropdownItem onClick={() => onCreateNote(note)}>
            <HugeiconsIcon icon={NoteAddIcon} size={15} color="currentColor" />
            New note inside
          </DropdownItem>
        )}
        {onCreateFolder && (
          <DropdownItem onClick={() => onCreateFolder(note)}>
            <HugeiconsIcon icon={FolderAddIcon} size={15} color="currentColor" />
            New folder inside
          </DropdownItem>
        )}
        <DropdownItem onClick={() => onMove(note)}>
          <HugeiconsIcon icon={FolderIcon} size={15} color="currentColor" />
          Move note
        </DropdownItem>
        <DropdownItem onClick={() => onDelete(note.id)}>
          <HugeiconsIcon icon={NoteRemoveIcon} size={15} color="currentColor" />
          Delete note
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
