import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  SettingsIcon,
  DatabaseSync01Icon,
  CommandIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export type SettingsSection = "appearance" | "account" | "keyboard" | "sync";

interface SettingsSidebarProps {
  selectedSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

interface SidebarItem {
  id: SettingsSection;
  label: string;
  icon: any;
  category?: string;
}

const sidebarItems: SidebarItem[] = [
  { id: "appearance", label: "Appearance", icon: SettingsIcon },
  { id: "account", label: "Account", icon: UserIcon },
  { id: "keyboard", label: "Keyboard Shortcuts", icon: CommandIcon },
  { id: "sync", label: "Sync", icon: DatabaseSync01Icon },
];

export function SettingsSidebar({
  selectedSection,
  onSectionChange,
}: SettingsSidebarProps) {
  return (
    <div className="w-64 shrink-0 border-r border-border bg-muted/30 p-4 h-full flex flex-col">
      <div className="space-y-1 flex-1">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedSection === item.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <HugeiconsIcon
              icon={item.icon}
              size={18}
              color="currentColor"
              strokeWidth={1.5}
            />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
