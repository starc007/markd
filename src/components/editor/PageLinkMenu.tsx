import { SuggestionMenu } from "../tiptap-ui-utils/suggestion-menu/suggestion-menu";
import { usePageLinkSuggestion } from "../../hooks/usePageLinkSuggestion";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon } from "@hugeicons/core-free-icons";
import type { SuggestionItem } from "../tiptap-ui-utils/suggestion-menu/suggestion-menu-types";
import type { Editor, Range } from "@tiptap/react";

export function PageLinkMenu() {
  const { getPageSuggestions } = usePageLinkSuggestion();

  return (
    <SuggestionMenu
      char="@"
      pluginKey="pageLinkSuggestion"
      decorationClass="tiptap-page-link-decoration"
      decorationContent="Search pages..."
      selector="tiptap-page-link-menu"
      items={({ query }) => {
        const suggestions = getPageSuggestions(query);
        return suggestions.map(
          (item): SuggestionItem => ({
            title: item.pageTitle,
            subtext: "Page",
            onSelect: ({ editor, range }: { editor: Editor; range: Range }) => {
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
          })
        );
      }}
    >
      {({ items, selectedIndex, onSelect }) => (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-1 min-w-[280px] max-w-[320px] max-h-[300px] overflow-y-auto">
          {items.map((item, index) => {
            const isSelected = index === selectedIndex;

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
                  icon={File02Icon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.5}
                  className="text-muted-foreground shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {item.title}
                  </div>
                  {item.subtext && (
                    <div className="text-xs text-muted-foreground">
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
