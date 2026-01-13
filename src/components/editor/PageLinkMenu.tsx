import { SuggestionMenu } from "../tiptap-ui-utils/suggestion-menu/suggestion-menu";
import { usePageLinkSuggestion } from "../../hooks/usePageLinkSuggestion";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon, LinkIcon } from "@hugeicons/core-free-icons";
import type { SuggestionItem } from "../tiptap-ui-utils/suggestion-menu/suggestion-menu-types";
import type { Editor, Range } from "@tiptap/react";
import { useBookmarkStore } from "@/stores/bookmarkStore";
import { useEffect } from "react";

interface PageLinkMenuProps {
  editor?: Editor | null;
  currentNoteId?: string | null;
}

export function PageLinkMenu({ editor, currentNoteId }: PageLinkMenuProps) {
  const { getPageSuggestions } = usePageLinkSuggestion(currentNoteId);
  const { bookmarks, loadBookmarks } = useBookmarkStore();

  // Load bookmarks when component mounts
  useEffect(() => {
    loadBookmarks();
  }, []);

  return (
    <SuggestionMenu
      editor={editor}
      char="@"
      pluginKey="pageLinkSuggestion"
      decorationClass="tiptap-page-link-decoration"
      decorationContent="Search pages..."
      selector="tiptap-page-link-menu"
      items={({ query }) => {
        try {
          // Get page suggestions - ensure it's an array
          const pageSuggestionsResult = getPageSuggestions(query);
          const pageSuggestions = Array.isArray(pageSuggestionsResult)
            ? pageSuggestionsResult
            : [];

          // Filter bookmarks based on query - ensure bookmarks is an array
          const safeBookmarks = Array.isArray(bookmarks) ? bookmarks : [];
          const bookmarkSuggestions = safeBookmarks
            .filter((bookmark) => {
              if (!bookmark || !bookmark.title || !bookmark.url) return false;
              const searchText = query.toLowerCase();
              return (
                bookmark.title.toLowerCase().includes(searchText) ||
                bookmark.url.toLowerCase().includes(searchText) ||
                (bookmark.tags &&
                  bookmark.tags.toLowerCase().includes(searchText))
              );
            })
            .slice(0, 5); // Limit to 5 bookmarks

          // Build page items
          const pageItems: SuggestionItem[] = [];
          for (const item of pageSuggestions) {
            if (item && item.pageId && item.pageTitle) {
              pageItems.push({
                title: item.pageTitle,
                subtext: "Page",
                icon: File02Icon,
                onSelect: ({
                  editor,
                  range,
                }: {
                  editor: Editor;
                  range: Range;
                }) => {
                  editor
                    .chain()
                    .focus()
                    .insertContentAt(range, [
                      {
                        type: "pageLink",
                        attrs: {
                          pageId: item.pageId,
                          pageTitle: item.pageTitle,
                        },
                      },
                      {
                        type: "text",
                        text: " ",
                      },
                    ])
                    .run();
                },
              });
            }
          }

          // Build bookmark items
          const bookmarkItems: SuggestionItem[] = [];
          for (const bookmark of bookmarkSuggestions) {
            if (bookmark && bookmark.id && bookmark.title && bookmark.url) {
              bookmarkItems.push({
                title: bookmark.title,
                subtext: "Bookmark",
                icon: LinkIcon,
                onSelect: ({
                  editor,
                  range,
                }: {
                  editor: Editor;
                  range: Range;
                }) => {
                  editor
                    .chain()
                    .focus()
                    .insertContentAt(range, [
                      {
                        type: "bookmarkLink",
                        attrs: {
                          bookmarkId: bookmark.id,
                          title: bookmark.title,
                          url: bookmark.url,
                          favicon: bookmark.favicon || null,
                        },
                      },
                      {
                        type: "text",
                        text: " ",
                      },
                    ])
                    .run();
                },
              });
            }
          }

          // Combine arrays using concat to avoid spread syntax issues
          return pageItems.concat(bookmarkItems);
        } catch (error) {
          console.error("Error in PageLinkMenu items:", error);
          return [];
        }
      }}
    >
      {({ items, selectedIndex, onSelect }) => (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-1 min-w-[280px] max-w-[320px] max-h-[300px] overflow-y-auto">
          {items.map((item, index) => {
            const isSelected = index === selectedIndex;
            const IconComponent = item.icon || File02Icon;

            return (
              <button
                key={index}
                type="button"
                className={`w-full text-left px-3 py-2 rounded hover:bg-accent flex items-center gap-2 transition-colors ${
                  isSelected ? "bg-accent" : ""
                }`}
                onClick={() => onSelect(item)}
              >
                <HugeiconsIcon
                  icon={IconComponent}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.5}
                  className="text-muted-foreground shrink-0"
                />
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="font-medium text-sm truncate">
                    {item.title}
                  </div>
                  {item.subtext && (
                    <div className="text-xs text-muted-foreground ml-2">
                      {item.subtext}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </SuggestionMenu>
  );
}
