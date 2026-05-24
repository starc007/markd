import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { NoteDocument } from "@/lib/types";
import { timeAgo } from "@/lib/format";

export function MarkdownEditor({
  note,
  content,
  onChange,
  onSave,
}: {
  note: NoteDocument;
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
}) {
  return (
    <main className="overflow-auto rounded-3xl border border-[#dedbd3] bg-transparent px-[clamp(28px,9vw,124px)] py-[clamp(28px,8vw,88px)] dark:border-[#34322e]">
      <div className="mb-5 flex items-center justify-between gap-2.5 text-xs text-[#6f6b64] dark:text-[#aaa39a]">
        <span className="flex items-center gap-2.5">
          <HugeiconsIcon icon={Calendar03Icon} size={14} color="currentColor" />
          Updated {timeAgo(note.meta.updatedAt)}
        </span>
        <span>{note.meta.path}</span>
      </div>
      <textarea
        className="min-h-[calc(100vh-190px)] w-full resize-none border-0 bg-transparent text-[17px] leading-[1.72] text-[#191817] outline-none selection:bg-[#e9eee6] dark:text-[#f4f1ea] dark:selection:bg-[#2a3029]"
        value={content}
        spellCheck
        onChange={(event) => onChange(event.target.value)}
        onBlur={onSave}
      />
    </main>
  );
}
