import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { ActionSwapText } from "@/components/motion/action-swap";
import { noteTitle } from "@/lib/utils";

/**
 * Folder path → title breadcrumb for the active note. Folders are static and
 * muted; only the title cascades (via ActionSwapText) on note change, so the
 * animation stays short and fast regardless of how deep the note is nested.
 */
export function NoteBreadcrumb({ rel }: { rel: string }) {
  const folders = rel.split("/").slice(0, -1);

  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[13.5px]">
      {folders.map((folder, index) => (
        <Fragment key={index}>
          <span className="max-w-[140px] shrink-0 truncate text-muted">
            {folder}
          </span>
          <ChevronRight
            size={13}
            strokeWidth={2}
            className="shrink-0 text-faint"
          />
        </Fragment>
      ))}
      <ActionSwapText
        value={rel}
        animation="roll"
        className="shrink-0 font-semibold text-ink"
      >
        {noteTitle(rel)}
      </ActionSwapText>
    </div>
  );
}
