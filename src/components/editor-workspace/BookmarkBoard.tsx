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
            className="flex items-center gap-3 rounded-[18px] border border-[#dedbd3] p-3.5 text-inherit no-underline transition-colors hover:bg-[#e9eee6] dark:border-[#34322e] dark:hover:bg-[#2a3029]"
            href={bookmark.url}
            key={bookmark.id}
          >
            <HugeiconsIcon icon={Link01Icon} size={18} color="currentColor" />
            <div className="grid gap-1">
              <strong>{bookmark.title}</strong>
              <span className="text-sm text-[#6f6b64] dark:text-[#aaa39a]">
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
