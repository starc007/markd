import { HugeiconsIcon } from "@hugeicons/react";
import { SearchIcon, CommandIcon } from "@hugeicons/core-free-icons";
import { useNoteStore } from "../../stores/noteStore";

export function TitleBar() {
  const { currentNote, isSaving, toggleCommandPalette } = useNoteStore();

  return (
    <header
      className="flex items-center h-[52px] px-5 bg-sidebar border-b border-sidebar-border"
      data-tauri-drag-region
    >
      {/* Traffic lights spacer (macOS) - draggable area */}
      <div className="w-[78px] shrink-0" data-tauri-drag-region />

      {/* Center section - draggable */}
      <div
        className="flex-1 flex justify-center items-center min-w-0"
        data-tauri-drag-region
      >
        {currentNote ? (
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-medium text-sidebar-foreground truncate">
              {currentNote.title || "Untitled"}
            </span>
            {isSaving && (
              <span className="text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                Saving
              </span>
            )}
          </div>
        ) : (
          <span className="text-[13px] font-semibold text-sidebar-foreground">
            Draft
          </span>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Search Bar - Clickable to open command palette */}
        <div className="relative [-webkit-app-region:no-drag]">
          <div className="relative w-[250px]">
            <HugeiconsIcon
              icon={SearchIcon}
              size={16}
              color="currentColor"
              strokeWidth={1.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              readOnly
              onClick={toggleCommandPalette}
              onFocus={toggleCommandPalette}
              placeholder="Search"
              className="w-full pl-10 pr-14 py-2 text-[13px] bg-secondary border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground outline-none cursor-pointer hover:bg-accent transition-colors"
            />
            {/* Keyboard shortcut hint */}
            <p className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-sm font-mono font-medium text-muted-foreground pointer-events-none">
              <HugeiconsIcon
                icon={CommandIcon}
                size={17}
                color="currentColor"
                strokeWidth={1.5}
              />
              K
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
