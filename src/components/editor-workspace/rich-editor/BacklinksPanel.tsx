import { Link01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { NoteRecord } from "@/lib/types";
import { getBacklinks, getPageLinks } from "./editorReferences";

export function BacklinksPanel({
  activeNoteId,
  activeTitle,
  content,
  notes,
}: {
  activeNoteId: string;
  activeTitle: string;
  content: string;
  notes: NoteRecord[];
}) {
  const linkedPages = getPageLinks(content, notes);
  const backlinks = getBacklinks(activeTitle, activeNoteId, notes);

  return (
    <aside className="hidden w-[250px] shrink-0 border-l border-line-soft px-4 py-5 text-sm dark:border-line-soft-dark min-[1180px]:block">
      <section>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-soft dark:text-muted-dark">
          <HugeiconsIcon icon={Link01Icon} size={14} color="currentColor" />
          Links
        </div>
        <div className="space-y-1.5">
          {linkedPages.length > 0 ? (
            linkedPages.map((note) => (
              <div
                className="truncate rounded-lg px-2 py-1.5 text-sidebar-ink-row hover:bg-hover dark:text-sidebar-ink-row-dark dark:hover:bg-hover-dark"
                key={note.id}
              >
                {note.title}
              </div>
            ))
          ) : (
            <p className="px-2 py-1.5 text-muted dark:text-muted-dark">
              No page links yet
            </p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-soft dark:text-muted-dark">
          Backlinks
        </div>
        <div className="space-y-1.5">
          {backlinks.length > 0 ? (
            backlinks.map((note) => (
              <div
                className="truncate rounded-lg px-2 py-1.5 text-sidebar-ink-row hover:bg-hover dark:text-sidebar-ink-row-dark dark:hover:bg-hover-dark"
                key={note.id}
              >
                {note.title}
              </div>
            ))
          ) : (
            <p className="px-2 py-1.5 text-muted dark:text-muted-dark">
              No backlinks yet
            </p>
          )}
        </div>
      </section>
    </aside>
  );
}

