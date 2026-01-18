import { Command } from "cmdk";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FileEditIcon,
  StickyNoteIcon,
  LinkIcon,
} from "@hugeicons/core-free-icons";
import { SearchResult } from "@/lib/tauri/commands";

const searchResultColors = {
  note: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  sticky_note:
    "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20",
  bookmark:
    "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20",
};

interface SearchResultsProps {
  groupedResults: {
    note: SearchResult[];
    sticky_note: SearchResult[];
    bookmark: SearchResult[];
  };
  onSelect: (action: string) => void;
}

export function SearchResults({
  groupedResults,
  onSelect,
}: SearchResultsProps) {
  const hasResults =
    groupedResults.note.length > 0 ||
    groupedResults.sticky_note.length > 0 ||
    groupedResults.bookmark.length > 0;

  if (!hasResults) return null;

  return (
    <>
      {groupedResults.note.length > 0 && (
        <Command.Group heading={`Notes (${groupedResults.note.length})`}>
          {groupedResults.note.map((result) => (
            <Command.Item
              key={result.id}
              value={`search-note:${result.id} ${result.title}`}
              onSelect={() => onSelect(`search-note:${result.id}`)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
            >
              <div className="flex items-center gap-2 shrink-0">
                <HugeiconsIcon
                  icon={FileEditIcon}
                  size={18}
                  color="currentColor"
                  strokeWidth={1.5}
                  className="opacity-50"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate flex items-center justify-between">
                  {result.title}
                  <span
                    className={`ml-2 text-[11px] font-mono px-1.5 py-0.5 rounded ${searchResultColors.note}`}
                  >
                    Note
                  </span>
                </div>
                {result.snippet && (
                  <div
                    className="text-[12px] text-muted-foreground truncate mt-0.5"
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />
                )}
              </div>
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {groupedResults.sticky_note.length > 0 && (
        <Command.Group
          heading={`Sticky Notes (${groupedResults.sticky_note.length})`}
        >
          {groupedResults.sticky_note.map((result) => (
            <Command.Item
              key={result.id}
              value={`search-sticky:${result.id} ${result.title}`}
              onSelect={() => onSelect(`search-sticky:${result.id}`)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
            >
              <HugeiconsIcon
                icon={StickyNoteIcon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
                className="opacity-50 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate flex items-center justify-between">
                  {result.title}
                  <span
                    className={`ml-2 text-[11px] font-mono px-1.5 py-0.5 rounded ${searchResultColors.sticky_note}`}
                  >
                    Sticky
                  </span>
                </div>
                {result.snippet && (
                  <div
                    className="text-[12px] text-muted-foreground truncate mt-0.5"
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />
                )}
              </div>
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {groupedResults.bookmark.length > 0 && (
        <Command.Group
          heading={`Bookmarks (${groupedResults.bookmark.length})`}
        >
          {groupedResults.bookmark.map((result) => (
            <Command.Item
              key={result.id}
              value={`search-bookmark:${result.id} ${result.title}`}
              onSelect={() => onSelect(`search-bookmark:${result.id}`)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent"
            >
              <HugeiconsIcon
                icon={LinkIcon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
                className="opacity-50 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate flex items-center justify-between">
                  {result.title}
                  <span
                    className={`ml-2 text-[11px] font-mono px-1.5 py-0.5 rounded ${searchResultColors.bookmark}`}
                  >
                    Bookmark
                  </span>
                </div>
                {result.snippet && (
                  <div
                    className="text-[12px] text-muted-foreground truncate mt-0.5"
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />
                )}
              </div>
            </Command.Item>
          ))}
        </Command.Group>
      )}
    </>
  );
}
