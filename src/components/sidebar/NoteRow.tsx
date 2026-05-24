import {
  FileEditIcon,
  FolderAddIcon,
  MoreHorizontalIcon,
  NoteAddIcon,
  NoteRemoveIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import { cx, Dropdown, DropdownItem } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import type { NoteRecord } from "@/lib/types";

export function NoteRow({
  note,
  active,
  onCreateFolder,
  onCreateNote,
  onDelete,
  onOpen,
}: {
  note: NoteRecord;
  active: boolean;
  onCreateFolder?: (note: NoteRecord) => void;
  onCreateNote?: (note: NoteRecord) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div
      className={cx(
        "group relative flex min-h-8 w-full items-center gap-1 rounded-lg text-sm font-medium text-sidebar-ink-row transition-colors hover:bg-sidebar-active dark:text-sidebar-ink-row-dark dark:hover:bg-sidebar-active-dark",
        active && "text-sidebar-ink-strong dark:text-sidebar-ink-strong-dark",
      )}
    >
      {active && (
        <motion.span
          layoutId="note-pill"
          className="absolute inset-0 -z-10 rounded-lg bg-sidebar-active dark:bg-sidebar-active-dark"
        />
      )}
      <button
        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left"
        onClick={() => onOpen(note.id)}
        type="button"
      >
        <HugeiconsIcon icon={FileEditIcon} size={16} color="currentColor" />
        <span className="min-w-0 flex-1 truncate">{note.title}</span>
        <small className="text-xs font-medium text-sidebar-ink-row-muted dark:text-sidebar-ink-row-muted-dark">
          {timeAgo(note.updatedAt)}
        </small>
      </button>
      <Dropdown
        label={
          <button
            aria-label={`Options for ${note.title}`}
            className="mr-1 grid h-6 w-6 place-items-center rounded-md text-sidebar-ink-muted opacity-0 transition-opacity hover:bg-sidebar-active hover:text-sidebar-ink-strong group-hover:opacity-100 data-[open]:opacity-100 dark:text-sidebar-ink-muted-dark dark:hover:bg-sidebar-active-dark dark:hover:text-sidebar-ink-strong-dark"
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
        <DropdownItem onClick={() => onDelete(note.id)}>
          <HugeiconsIcon icon={NoteRemoveIcon} size={15} color="currentColor" />
          Delete note
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
