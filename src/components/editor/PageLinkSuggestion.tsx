import { forwardRef, useCallback, useMemo, useImperativeHandle } from "react";
import type { Editor } from "@tiptap/react";
import type { SuggestionProps } from "@tiptap/suggestion";
import { useMenuNavigation } from "../../hooks/tiptap/use-menu-navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon } from "@hugeicons/core-free-icons";
import type { PageLinkSuggestionItem } from "../../lib/tiptap-extension/page-link-extension";

export interface PageLinkSuggestionProps
  extends SuggestionProps<PageLinkSuggestionItem> {
  editor: Editor;
}

export const PageLinkSuggestion = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  PageLinkSuggestionProps
>(({ editor, items, query, command, clientRect }, ref) => {
  // Filter pages based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return items.slice(0, 10); // Limit to 10 when no query
    }

    const lowerQuery = query.toLowerCase();
    return items
      .filter((item) => item.pageTitle.toLowerCase().includes(lowerQuery))
      .slice(0, 10);
  }, [items, query]);

  // Handle selection
  const handleSelect = useCallback(
    (item: PageLinkSuggestionItem) => {
      if (command) {
        command({
          pageId: item.pageId,
          pageTitle: item.pageTitle,
        });
      }
    },
    [command]
  );

  // Keyboard navigation
  const { selectedIndex } = useMenuNavigation({
    editor,
    items: filteredItems,
    query: query,
    onSelect: (item) => handleSelect(item),
    onClose: () => {
      // Close is handled by the suggestion extension
    },
  });

  // Expose onKeyDown for suggestion extension
  useImperativeHandle(ref, () => ({
    onKeyDown: () => {
      // Let useMenuNavigation handle keyboard events
      return false;
    },
  }));

  if (filteredItems.length === 0) {
    return null;
  }

  // Use clientRect from suggestion extension for positioning
  const rect = typeof clientRect === "function" ? clientRect() : clientRect;
  const positionStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`,
        zIndex: 50,
      }
    : { display: "none" };

  return (
    <div
      style={positionStyle}
      className="bg-popover border border-border rounded-lg shadow-lg p-1 min-w-[280px] max-w-[320px] max-h-[300px] overflow-y-auto"
    >
      {filteredItems.map((item, index) => {
        const isSelected = index === selectedIndex;

        return (
          <button
            key={item.pageId}
            type="button"
            className={`w-full text-left px-3 py-2 rounded hover:bg-accent flex items-center gap-2 transition-colors ${
              isSelected ? "bg-accent" : ""
            }`}
            onClick={() => handleSelect(item)}
          >
            <HugeiconsIcon
              icon={File02Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.5}
              className="text-muted-foreground shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {item.pageTitle}
              </div>
            </div>
          </button>
        );
      })}

      {filteredItems.length === 0 && (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
          No pages found
        </div>
      )}
    </div>
  );
});

PageLinkSuggestion.displayName = "PageLinkSuggestion";
