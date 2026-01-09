import { HugeiconsIcon } from "@hugeicons/react";
import { StickyNoteIcon, Bookmark01Icon } from "@hugeicons/core-free-icons";
import { NavItem, SectionHeading } from "../ui";
import { UIView } from "../../stores/uiStore";

interface SidebarNavigationProps {
  stickyNotesCount: number;
  currentView: UIView | null;
  onViewChange: (view: UIView) => void;
}

export function SidebarNavigation({
  stickyNotesCount,
  currentView,
  onViewChange,
}: SidebarNavigationProps) {
  return (
    <div className="shrink-0 p-3 space-y-6 border-b border-sidebar-border">
      <div>
        <SectionHeading>Personal</SectionHeading>
        <div className="space-y-0.5">
          <NavItem
            icon={
              <HugeiconsIcon
                icon={StickyNoteIcon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
              />
            }
            label="Sticky Notes"
            count={stickyNotesCount}
            isActive={currentView === UIView.StickyNotes}
            onClick={() => onViewChange(UIView.StickyNotes)}
          />
          <NavItem
            icon={
              <HugeiconsIcon
                icon={Bookmark01Icon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
              />
            }
            label="Bookmarks"
            count={0}
            isActive={false}
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
