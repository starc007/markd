import { HugeiconsIcon } from "@hugeicons/react";
import { SettingsIcon } from "@hugeicons/core-free-icons";
import { NavItem, SectionHeading } from "../ui";
import { useUIStore } from "@/stores/uiStore";

export function SidebarSettings() {
  const setSettingsModalOpen = useUIStore(
    (state) => state.setSettingsModalOpen
  );

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
      </div>
    </div>
  );
}
