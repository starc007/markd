import { useTabStore } from "../../stores/tabStore";
import { UpdateIndicator } from "../update/UpdateIndicator";

export function TitleBar() {
  // Use selective subscriptions to prevent unnecessary re-renders
  const activeTab = useTabStore((state) => state.getActiveTab());

  return (
    <header
      className="relative flex items-center h-[40px] px-5 bg-sidebar border-b border-sidebar-border"
      data-tauri-drag-region
    >
      {/* Update Indicator - positioned in top-left */}
      <UpdateIndicator />

      {/* Traffic lights spacer (macOS) - draggable area */}
      <div className="w-[78px] shrink-0" data-tauri-drag-region />

      {/* Center section - draggable */}
      <div
        className="flex-1 flex justify-center items-center min-w-0"
        data-tauri-drag-region
      >
        {activeTab ? (
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-medium text-sidebar-foreground truncate">
              {activeTab.title || "Untitled"}
            </span>
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
