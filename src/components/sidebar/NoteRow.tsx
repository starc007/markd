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
        "relative flex min-h-11 w-full items-center gap-2.5 rounded-[13px] border-0 bg-transparent px-3.5 py-2 text-left text-[19px] font-medium text-[#d7d7d7]",
        active && "text-[#f3f3f3]",
      )}
      onClick={() => onOpen(note.id)}
    >
      {active && (
        <motion.span
          layoutId="note-pill"
          className="absolute inset-0 -z-10 rounded-[13px] bg-[#3a3a3a]"
        />
      )}
      <HugeiconsIcon icon={FileEditIcon} size={22} color="currentColor" />
      <span className="min-w-0 flex-1 truncate">{note.title}</span>
      <small className="text-[17px] font-medium text-[#9c9c9c]">
        {timeAgo(note.updatedAt)}
      </small>
    </button>
  );
}
