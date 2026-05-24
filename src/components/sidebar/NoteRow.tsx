import { FileEditIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import { cx } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import type { NoteRecord } from "@/lib/types";

export function NoteRow({
  note,
  active,
  onOpen,
}: {
  note: NoteRecord;
  active: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      className={cx(
        "relative flex min-h-8 w-full items-center gap-2 rounded-lg border-0 bg-transparent px-2 py-1.5 text-left text-sm font-medium text-sidebar-ink-row transition-colors hover:bg-sidebar-active dark:text-sidebar-ink-row-dark dark:hover:bg-sidebar-active-dark",
        active && "text-sidebar-ink-strong dark:text-sidebar-ink-strong-dark",
      )}
      onClick={() => onOpen(note.id)}
    >
      {active && (
        <motion.span
          layoutId="note-pill"
          className="absolute inset-0 -z-10 rounded-lg bg-sidebar-active dark:bg-sidebar-active-dark"
        />
      )}
      <HugeiconsIcon icon={FileEditIcon} size={16} color="currentColor" />
      <span className="min-w-0 flex-1 truncate">{note.title}</span>
      <small className="text-xs font-medium text-sidebar-ink-row-muted dark:text-sidebar-ink-row-muted-dark">
        {timeAgo(note.updatedAt)}
      </small>
    </button>
  );
}
