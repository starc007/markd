import { HugeiconsIcon } from "@hugeicons/react";
import { SettingsIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { NavItem, SectionHeading } from "../ui";
import { useUIStore, UIView } from "@/stores/uiStore";

interface SidebarSettingsProps {
  trashedNotesCount: number;
}

export function SidebarSettings({ trashedNotesCount }: SidebarSettingsProps) {
  const setSettingsModalOpen = useUIStore(
    (state) => state.setSettingsModalOpen
  );
  const currentView = useUIStore((state) => state.currentView);
  const setView = useUIStore((state) => state.setView);

  const handleSettingsClick = () => {
    setSettingsModalOpen(true);
  };

  return (
    <div className="p-3 border-t border-sidebar-border">
      <SectionHeading>Settings</SectionHeading>
      <div className="space-y-0.5">
        <NavItem
          icon={
            <HugeiconsIcon
              icon={SettingsIcon}
              size={20}
              color="currentColor"
              strokeWidth={1.5}
            />
          }
          label="Settings"
          onClick={handleSettingsClick}
        />
        <NavItem
          icon={
            <HugeiconsIcon
              icon={Delete02Icon}
              size={18}
              color="currentColor"
              strokeWidth={1.5}
            />
          }
          label="Trash"
          count={trashedNotesCount}
          isActive={currentView === UIView.Trash}
          onClick={() => setView(UIView.Trash)}
        />
      </div>
    </div>
  );
}
