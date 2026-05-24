import { Bookmark01Icon, Link01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui";
import type { BookmarkRecord } from "@/lib/types";
import { Board } from "./Board";

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
    <Board title="Bookmarks" icon={Bookmark01Icon}>
      <div className="grid gap-3">
        {bookmarks.map((bookmark) => (
          <a
            className="flex items-center gap-3 rounded-[18px] border border-line p-3.5 text-inherit no-underline transition-colors hover:bg-hover dark:border-line-dark dark:hover:bg-hover-dark"
            href={bookmark.url}
            key={bookmark.id}
          >
            <HugeiconsIcon icon={Link01Icon} size={18} color="currentColor" />
            <div className="grid gap-1">
              <strong>{bookmark.title}</strong>
              <span className="text-sm text-muted dark:text-muted-dark">
                {bookmark.url}
              </span>
            </div>
          </a>
        ))}
        <Button onClick={() => onSave({ title: "New bookmark", url: "https://example.com" })}>
          Add bookmark
        </Button>
      </div>
    </Board>
  );
}
