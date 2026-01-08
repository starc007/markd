import { useEffect, useMemo, useRef } from "react";

// --- Lib ---
import { getElementOverflowPosition } from "../../../lib/tiptap-collab-utils";

// --- Tiptap UI ---
import type {
  SuggestionMenuProps,
  SuggestionItem,
  SuggestionMenuRenderProps,
} from "../../tiptap-ui-utils/suggestion-menu";
import { filterSuggestionItems } from "../../tiptap-ui-utils/suggestion-menu";
import { SuggestionMenu } from "../../tiptap-ui-utils/suggestion-menu";

// --- Hooks ---
import type { SlashMenuConfig } from "./use-slash-dropdown-menu";
import { useSlashDropdownMenu } from "./use-slash-dropdown-menu";

// --- UI Components ---
import { SectionHeading } from "../../ui/SectionHeading";

import "./slash-dropdown-menu.css";

type SlashDropdownMenuProps = Omit<
  SuggestionMenuProps,
  "items" | "children"
> & {
  config?: SlashMenuConfig;
};

export const SlashDropdownMenu = (props: SlashDropdownMenuProps) => {
  const { config, ...restProps } = props;
  const { getSlashMenuItems } = useSlashDropdownMenu(config);

  return (
    <SuggestionMenu
      char="/"
      pluginKey="slashDropdownMenu"
      decorationClass="tiptap-slash-decoration"
      decorationContent="Filter..."
      selector="tiptap-slash-dropdown-menu"
      items={({ query, editor }) =>
        filterSuggestionItems(getSlashMenuItems(editor), query)
      }
      {...restProps}
    >
      {(props) => <List {...props} config={config} />}
    </SuggestionMenu>
  );
};

const Item = (props: {
  item: SuggestionItem;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const { item, isSelected, onSelect } = props;
  const itemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const selector = document.querySelector(
      '[data-selector="tiptap-slash-dropdown-menu"]'
    ) as HTMLElement;
    if (!itemRef.current || !isSelected || !selector) return;

    const overflow = getElementOverflowPosition(itemRef.current, selector);

    if (overflow === "top") {
      itemRef.current.scrollIntoView({ block: "start", behavior: "smooth" });
    } else if (overflow === "bottom") {
      itemRef.current.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }, [isSelected]);

  const BadgeIcon = item.badge;

  return (
    <button
      ref={itemRef}
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-3 py-2 rounded hover:bg-accent flex items-start gap-3 transition-colors ${
        isSelected ? "bg-accent" : ""
      }`}
    >
      {BadgeIcon && (
        <span className="text-muted-foreground shrink-0 mt-0.5">
          <BadgeIcon className="w-5 h-5" />
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{item.title}</div>
      </div>
    </button>
  );
};

const List = ({
  items,
  selectedIndex,
  onSelect,
  config,
}: SuggestionMenuRenderProps & { config?: SlashMenuConfig }) => {
  const renderedItems = useMemo(() => {
    const rendered: React.ReactElement[] = [];
    const showGroups = config?.showGroups !== false;

    if (!showGroups) {
      items.forEach((item, index) => {
        rendered.push(
          <Item
            key={`item-${index}-${item.title}`}
            item={item}
            isSelected={index === selectedIndex}
            onSelect={() => onSelect(item)}
          />
        );
      });
      return rendered;
    }

    const groups: {
      [groupLabel: string]: { items: SuggestionItem[]; indices: number[] };
    } = {};

    items.forEach((item, index) => {
      const groupLabel = item.group || "";
      if (!groups[groupLabel]) {
        groups[groupLabel] = { items: [], indices: [] };
      }
      groups[groupLabel].items.push(item);
      groups[groupLabel].indices.push(index);
    });

    Object.entries(groups).forEach(([groupLabel, groupData], groupIndex) => {
      if (groupIndex > 0) {
        rendered.push(
          <div
            key={`separator-${groupIndex}`}
            className="h-px bg-border my-1"
          />
        );
      }

      const groupItems = groupData.items.map((item, itemIndex) => {
        const originalIndex = groupData.indices[itemIndex];
        return (
          <Item
            key={`item-${originalIndex}-${item.title}`}
            item={item}
            isSelected={originalIndex === selectedIndex}
            onSelect={() => onSelect(item)}
          />
        );
      });

      if (groupLabel) {
        rendered.push(
          <div
            key={`group-${groupIndex}-${groupLabel}`}
            className="mb-2 last:mb-0"
          >
            <SectionHeading className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
              {groupLabel}
            </SectionHeading>
            <div className="flex flex-col">{groupItems}</div>
          </div>
        );
      } else {
        rendered.push(...groupItems);
      }
    });

    return rendered;
  }, [items, selectedIndex, onSelect, config?.showGroups]);

  if (!renderedItems.length) {
    return null;
  }

  return (
    <div
      className="bg-popover border border-border rounded-lg shadow-lg p-1 min-w-[280px] max-w-[320px] overflow-y-auto"
      style={{
        maxHeight: "var(--suggestion-menu-max-height, 400px)",
      }}
    >
      {renderedItems}
    </div>
  );
};
