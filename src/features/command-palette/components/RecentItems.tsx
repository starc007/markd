import { Command } from "cmdk";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FileEditIcon,
  Bookmark01Icon,
  StickyNoteIcon,
} from "@hugeicons/core-free-icons";
import { FingerprintIndicator } from "@/features/visual-identity/components/FingerprintIndicator";

const searchResultColors = {
  note: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  bookmark:
    "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20",
  sticky_note:
    "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20",
};

interface RecentItem {
  type: "note" | "bookmark" | "sticky_note";
  id: string;
  title: string;
  updated_at: number;
}

interface RecentItemsProps {
  items: RecentItem[];
  onSelect: (action: string) => void;
}

export function RecentItems({ items, onSelect }: RecentItemsProps) {
  if (items.length === 0) return null;

  return (
    <Command.Group heading="Recent">
      {items.map((item) => {
        const isBookmark = item.type === "bookmark";
        const isStickyNote = item.type === "sticky_note";
        const icon = isBookmark
          ? Bookmark01Icon
          : isStickyNote
          ? StickyNoteIcon
          : FileEditIcon;
        const actionPrefix = isBookmark
          ? "recent-bookmark:"
          : isStickyNote
          ? "recent-sticky-note:"
          : "recent-note:";
        const typeLabel = isBookmark
          ? "Bookmark"
          : isStickyNote
          ? "Sticky Note"
          : "Note";
        const typeColor = isBookmark
          ? searchResultColors.bookmark
          : isStickyNote
          ? searchResultColors.sticky_note
          : searchResultColors.note;

        return (
          <Command.Item
            key={`${item.type}-${item.id}`}
            value={`${actionPrefix}${item.id} ${item.title}`}
            onSelect={() => onSelect(`${actionPrefix}${item.id}`)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
          >
            {!isBookmark && !isStickyNote && (
              <FingerprintIndicator
                noteId={item.id}
                title={item.title}
                content=""
                brightness={1}
              />
            )}
            <HugeiconsIcon
              icon={icon}
              size={18}
              color="currentColor"
              strokeWidth={1.5}
              className="opacity-50 shrink-0"
            />
            <span className="flex-1 font-medium truncate">{item.title}</span>
            <span
              className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${typeColor}`}
            >
              {typeLabel}
            </span>
          </Command.Item>
        );
      })}
    </Command.Group>
  );
}
