import { useNoteStore } from "../../stores/noteStore";

export function TitleBar() {
  const { currentNote, isSaving } = useNoteStore();

  return (
    <header
      className="flex items-center h-[40px] px-5 bg-sidebar border-b border-sidebar-border"
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
    </header>
  );
}
