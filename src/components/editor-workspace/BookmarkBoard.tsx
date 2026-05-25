import {
  ArrowUpRight01Icon,
  Bookmark01Icon,
  BookmarkAdd01Icon,
  Link01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, EmptyState } from "@/components/ui";
import type { BookmarkRecord } from "@/lib/types";
import { Board } from "./Board";

function getBookmarkHost(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function BookmarkBoard({
  bookmarks,
  onSave,
}: {
  bookmarks: BookmarkRecord[];
  onSave: (
    bookmark: Partial<BookmarkRecord> & Pick<BookmarkRecord, "title" | "url">,
  ) => void;
}) {
  return (
    <Board
      title="Bookmarks"
      icon={Bookmark01Icon}
      description="Saved links with enough context to find the right reference quickly."
      meta={
        <Button
          className="min-h-8 rounded-xl px-2.5 text-xs"
          onClick={() => onSave({ title: "New bookmark", url: "https://example.com" })}
        >
          <HugeiconsIcon icon={BookmarkAdd01Icon} size={14} color="currentColor" />
          Add
        </Button>
      }
    >
      {bookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark01Icon}
          title="No bookmarks yet"
          description="Save useful links here so references stay close to the notes they support."
          action={
            <Button onClick={() => onSave({ title: "New bookmark", url: "https://example.com" })}>
              <HugeiconsIcon icon={BookmarkAdd01Icon} size={15} color="currentColor" />
              Add bookmark
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-panel dark:border-line-dark dark:bg-panel-dark">
          {bookmarks.map((bookmark) => (
            <a
              className="group flex items-center gap-3 border-b border-line-soft px-3 py-2.5 text-inherit no-underline transition-colors last:border-b-0 hover:bg-hover dark:border-line-soft-dark dark:hover:bg-hover-dark"
              href={bookmark.url}
              key={bookmark.id}
              rel="noreferrer"
              target="_blank"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-line bg-panel-soft text-muted dark:border-line-dark dark:bg-panel-soft-dark dark:text-muted-dark">
                <HugeiconsIcon icon={Link01Icon} size={15} color="currentColor" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink dark:text-ink-dark">
                  {bookmark.title}
                </div>
                <div className="mt-0.5 truncate text-xs text-muted dark:text-muted-dark">
                  {getBookmarkHost(bookmark.url)}
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                size={14}
                color="currentColor"
                className="text-muted opacity-0 transition-opacity group-hover:opacity-100 dark:text-muted-dark"
              />
            </a>
          ))}
        </div>
      )}
    </Board>
  );
}
