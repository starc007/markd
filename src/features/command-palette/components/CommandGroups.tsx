import { Command } from "cmdk";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AddIcon,
  MaximizeIcon,
  Download01Icon,
  CommandIcon,
  SettingsIcon,
  StickyNoteIcon,
  Bookmark01Icon,
  FileEditIcon,
} from "@hugeicons/core-free-icons";
import { useTabStore } from "@/stores/tabStore";

interface CommandGroupsProps {
  currentNote: { id: string; title: string } | null;
  onSelect: (action: string) => void;
}

export function CommandGroups({ currentNote, onSelect }: CommandGroupsProps) {
  const { openTabs, activeTabId } = useTabStore();

  return (
    <>
      {/* Tabs Category - only show if tabs are open */}
      {openTabs.length > 0 && (
        <Command.Group heading="Switch Tab">
          {openTabs.slice(0, 9).map((tab, index) => (
            <Command.Item
              key={tab.id}
              value={`switch tab ${index + 1} ${tab.title}`}
              onSelect={() => onSelect(`switch-tab:${tab.id}`)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
            >
              <HugeiconsIcon
                icon={FileEditIcon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
                className={`opacity-50 ${
                  tab.id === activeTabId ? "opacity-100" : ""
                }`}
              />
              <span className="flex-1 font-medium truncate">{tab.title}</span>
              {index < 9 && (
                <kbd className="flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                  <HugeiconsIcon
                    icon={CommandIcon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.5}
                  />
                  <span>{index + 1}</span>
                </kbd>
              )}
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {/* Create Category */}
      <Command.Group heading="Create">
        <Command.Item
          value="new note"
          onSelect={() => onSelect("new-note")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
        >
          <HugeiconsIcon
            icon={AddIcon}
            size={18}
            color="currentColor"
            strokeWidth={1.5}
            className="opacity-50"
          />
          <span className="flex-1 font-medium">New Note</span>

          <kbd className="flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            <HugeiconsIcon
              icon={CommandIcon}
              size={14}
              color="currentColor"
              strokeWidth={1.5}
            />
            <span>N</span>
          </kbd>
        </Command.Item>
        <Command.Item
          value="new sticky note"
          onSelect={() => onSelect("new-sticky-note")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
        >
          <HugeiconsIcon
            icon={AddIcon}
            size={18}
            color="currentColor"
            strokeWidth={1.5}
            className="opacity-50"
          />
          <span className="flex-1 font-medium">New Sticky Note</span>
          <kbd className="flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            <HugeiconsIcon
              icon={CommandIcon}
              size={14}
              color="currentColor"
              strokeWidth={1.5}
            />
            <span>+</span>
            <span>Shift</span>
            <span>+</span>
            <span>N</span>
          </kbd>
        </Command.Item>
      </Command.Group>

      {/* Navigate Category */}
      <Command.Group heading="Navigate">
        <Command.Item
          value="open sticky notes"
          onSelect={() => onSelect("open-sticky-notes")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
        >
          <HugeiconsIcon
            icon={StickyNoteIcon}
            size={18}
            color="currentColor"
            strokeWidth={1.5}
            className="opacity-50"
          />
          <span className="flex-1 font-medium">Open Sticky Notes</span>
          <kbd className="flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            <HugeiconsIcon
              icon={CommandIcon}
              size={14}
              color="currentColor"
              strokeWidth={1.5}
            />
            <span>+</span>
            <span>Shift</span>
            <span>+</span>
            <span>O</span>
          </kbd>
        </Command.Item>
        <Command.Item
          value="open bookmarks"
          onSelect={() => onSelect("open-bookmarks")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
        >
          <HugeiconsIcon
            icon={Bookmark01Icon}
            size={18}
            color="currentColor"
            strokeWidth={1.5}
            className="opacity-50"
          />
          <span className="flex-1 font-medium">Open Bookmarks</span>
          <kbd className="flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            <HugeiconsIcon
              icon={CommandIcon}
              size={14}
              color="currentColor"
              strokeWidth={1.5}
            />
            <span>+</span>
            <span>Shift</span>
            <span>+</span>
            <span>B</span>
          </kbd>
        </Command.Item>
      </Command.Group>

      {/* Actions Category */}
      <Command.Group heading="Actions">
        <Command.Item
          value="toggle sidebar"
          onSelect={() => onSelect("focus-mode")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
        >
          <HugeiconsIcon
            icon={MaximizeIcon}
            size={18}
            color="currentColor"
            strokeWidth={1.5}
            className="opacity-50"
          />
          <span className="flex-1 font-medium">Toggle Sidebar</span>
          <kbd className="flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            <HugeiconsIcon
              icon={CommandIcon}
              size={14}
              color="currentColor"
              strokeWidth={1.5}
            />
            <span>\</span>
          </kbd>
        </Command.Item>
        {currentNote && (
          <Command.Item
            value="export note"
            onSelect={() => onSelect("export")}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
          >
            <HugeiconsIcon
              icon={Download01Icon}
              size={18}
              color="currentColor"
              strokeWidth={1.5}
              className="opacity-50"
            />
            <span className="flex-1 font-medium">Export Note</span>
          </Command.Item>
        )}
      </Command.Group>

      {/* Settings Category */}
      <Command.Group heading="Settings">
        <Command.Item
          value="settings"
          onSelect={() => onSelect("settings")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] text-foreground data-[selected=true]:bg-accent group"
        >
          <HugeiconsIcon
            icon={SettingsIcon}
            size={18}
            color="currentColor"
            strokeWidth={1.5}
            className="opacity-50"
          />
          <span className="flex-1 font-medium">Settings</span>

          <kbd className="flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            <HugeiconsIcon
              icon={CommandIcon}
              size={14}
              color="currentColor"
              strokeWidth={1.5}
            />
            <span>,</span>
          </kbd>
        </Command.Item>
      </Command.Group>
    </>
  );
}
