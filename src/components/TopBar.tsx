import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  CheckmarkCircle01Icon,
  FolderIcon,
  MoreVerticalIcon,
  Moon02Icon,
  Search01Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import { Button, Dropdown, DropdownItem, IconButton } from "@/components/ui";
import { useWorkspaceStore } from "@/stores/workspace";

export function TopBar() {
  const saving = useWorkspaceStore((state) => state.saving);
  const rootPath = useWorkspaceStore((state) => state.rootPath);
  const createNote = useWorkspaceStore((state) => state.createNote);
  const createFolder = useWorkspaceStore((state) => state.createFolder);
  const setCommandOpen = useWorkspaceStore((state) => state.setCommandOpen);
  const theme = useWorkspaceStore((state) => state.theme);
  const setTheme = useWorkspaceStore((state) => state.setTheme);

  return (
    <header
      className="flex h-[52px] items-center justify-between rounded-[22px] border border-[#dedbd3] bg-white/80 px-2.5 pl-4 backdrop-blur-[22px] dark:border-[#34322e] dark:bg-[#22211e]/80"
      data-tauri-drag-region
    >
      <div className="flex items-center gap-2.5">
        <span className="h-[11px] w-[11px] rounded-full bg-[#ff665c]" />
        <strong>Draft</strong>
        <span className="text-[#6f6b64] dark:text-[#aaa39a]">{rootPath || "File workspace"}</span>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="flex items-center gap-2.5 text-[#6f6b64] dark:text-[#aaa39a]">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} color="currentColor" />
          {saving ? "Saving" : "Saved"}
        </span>
        <IconButton onClick={() => setCommandOpen(true)} aria-label="Search">
          <HugeiconsIcon icon={Search01Icon} size={18} color="currentColor" />
        </IconButton>
        <IconButton
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label="Toggle theme"
        >
          <HugeiconsIcon icon={theme === "light" ? Moon02Icon : Sun03Icon} size={18} color="currentColor" />
        </IconButton>
        <Button onClick={() => createNote()} variant="primary">
          <HugeiconsIcon icon={Add01Icon} size={16} color="currentColor" />
          Note
        </Button>
        <Dropdown
          label={
            <IconButton aria-label="More">
              <HugeiconsIcon icon={MoreVerticalIcon} size={18} color="currentColor" />
            </IconButton>
          }
        >
          <DropdownItem onClick={() => createFolder()}>
            <HugeiconsIcon icon={FolderIcon} size={16} color="currentColor" />
            New folder
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
