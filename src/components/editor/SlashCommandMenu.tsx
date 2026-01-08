import { useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import type { Editor } from "@tiptap/react";
import type { SuggestionProps } from "@tiptap/suggestion";
import { useMenuNavigation } from "../../hooks/tiptap/use-menu-navigation";
import { SectionHeading } from "../ui/SectionHeading";

export interface SlashCommandItem {
  title: string;
  description?: string;
  icon?: string;
  group?: string;
  command: (props: {
    editor: Editor;
    range: { from: number; to: number };
  }) => void;
  keywords?: string[];
}

interface SlashCommandMenuProps extends SuggestionProps<SlashCommandItem> {
  editor: Editor;
}

// Group commands by category
function groupCommands(
  items: SlashCommandItem[]
): Map<string, SlashCommandItem[]> {
  const grouped = new Map<string, SlashCommandItem[]>();

  for (const item of items) {
    const group = item.group || "Basic";
    if (!grouped.has(group)) {
      grouped.set(group, []);
    }
    grouped.get(group)!.push(item);
  }

  return grouped;
}

// Filter commands based on query
function filterCommands(
  items: SlashCommandItem[],
  query: string
): SlashCommandItem[] {
  if (!query.trim()) return items;

  const lowerQuery = query.toLowerCase();
  return items.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(lowerQuery);
    const descMatch = item.description?.toLowerCase().includes(lowerQuery);
    const keywordMatch = item.keywords?.some((k) =>
      k.toLowerCase().includes(lowerQuery)
    );

    return titleMatch || descMatch || keywordMatch;
  });
}

export const SlashCommandMenu = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  SlashCommandMenuProps
>(({ editor, items, query, command, clientRect }, ref) => {
  // Filter and group commands
  const filteredItems = useMemo(
    () => filterCommands(items, query),
    [items, query]
  );

  const groupedCommands = useMemo(
    () => groupCommands(filteredItems),
    [filteredItems]
  );

  // Flatten grouped commands for navigation
  const flatItems = useMemo(() => {
    const flat: Array<{ item: SlashCommandItem; group: string }> = [];
    for (const [group, groupItems] of groupedCommands.entries()) {
      for (const item of groupItems) {
        flat.push({ item, group });
      }
    }
    return flat;
  }, [groupedCommands]);

  // Handle selection
  const handleSelect = useCallback(
    (entry: { item: SlashCommandItem; group: string }) => {
      if (command) {
        command(entry.item);
      }
    },
    [command]
  );

  // Keyboard navigation
  const { selectedIndex } = useMenuNavigation({
    editor,
    items: flatItems,
    query: query,
    onSelect: (entry) => handleSelect(entry),
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

  if (filteredItems.length === 0) return null;

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
      className="bg-popover border border-border rounded-lg shadow-lg p-1 min-w-[280px] max-w-[320px] max-h-[400px] overflow-y-auto"
    >
      {Array.from(groupedCommands.entries()).map(([group, groupItems]) => (
        <div key={group} className="mb-2 last:mb-0">
          <SectionHeading className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
            {group}
          </SectionHeading>
          {groupItems.map((item, itemIndex) => {
            // Find the index in flatItems
            const flatIndex = flatItems.findIndex(
              (entry) => entry.item === item && entry.group === group
            );
            const isSelected = flatIndex === selectedIndex;

            return (
              <button
                key={`${group}-${itemIndex}`}
                type="button"
                className={`w-full text-left px-3 py-2 rounded hover:bg-accent flex items-start gap-3 ${
                  isSelected ? "bg-accent" : ""
                }`}
                onClick={() => handleSelect({ item, group })}
              >
                {item.icon && (
                  <span className="text-muted-foreground text-lg shrink-0 mt-0.5">
                    {item.icon}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.title}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {item.description}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ))}

      {filteredItems.length === 0 && (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
          No commands found
        </div>
      )}
    </div>
  );
});

SlashCommandMenu.displayName = "SlashCommandMenu";
