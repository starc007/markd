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
    <main className="overflow-auto bg-panel dark:bg-panel-dark px-[clamp(36px,9vw,128px)] py-[clamp(34px,8vw,88px)]">
      <div className="mb-5 flex items-center justify-between gap-2.5 text-xs text-muted dark:text-muted-dark">
        <span className="flex items-center gap-2.5">
          <HugeiconsIcon icon={Calendar03Icon} size={14} color="currentColor" />
          Updated {timeAgo(note.meta.updatedAt)}
        </span>
        <span>{note.meta.path}</span>
      </div>
      <textarea
        className="min-h-[calc(100vh-190px)] w-full resize-none border-0 bg-transparent text-[17px] leading-[1.72] text-ink outline-none selection:bg-hover dark:text-ink-dark dark:selection:bg-hover-dark"
        value={content}
        spellCheck
        onChange={(event) => onChange(event.target.value)}
        onBlur={onSave}
      />
    </main>
  );
}
