import { Command } from "cmdk";
import { HugeiconsIcon } from "@hugeicons/react";
import { FileEditIcon, Bookmark01Icon } from "@hugeicons/core-free-icons";

const searchResultColors = {
  note: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  bookmark:
    "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20",
};

interface RecentItem {
  type: "note" | "bookmark";
  id: string;
  title: string;
  updated_at: number;
}

interface RecentItemsProps {
  items: RecentItem[];
  onSelect: (action: string) => void;
  onHover: (id: string | null) => void;
  hoveredItem: string | null;
}

export function RecentItems({
  items,
  onSelect,
  onHover,
  hoveredItem,
}: RecentItemsProps) {
  if (items.length === 0) return null;

  return (
    <Command.Group heading="Recent">
      {items.map((item) => {
        const isBookmark = item.type === "bookmark";
        const icon = isBookmark ? Bookmark01Icon : FileEditIcon;
        const actionPrefix = isBookmark ? "recent-bookmark:" : "recent-note:";
        const typeLabel = isBookmark ? "Bookmark" : "Note";
        const typeColor = isBookmark
          ? searchResultColors.bookmark
          : searchResultColors.note;

        return (
          <Command.Item
            key={`${item.type}-${item.id}`}
            value={`${actionPrefix}${item.id} ${item.title}`}
            onSelect={() => onSelect(`${actionPrefix}${item.id}`)}
            onMouseEnter={() => onHover(`${actionPrefix}${item.id}`)}
            onMouseLeave={() => onHover(null)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
          >
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
