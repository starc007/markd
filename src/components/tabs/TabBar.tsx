import { useTabStore } from "@/stores/tabStore";
import { Tab } from "./Tab";

export function TabBar() {
  const { openTabs, activeTabId, closeTab } = useTabStore();

  if (openTabs.length === 0) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-0 border-b border-border bg-muted overflow-x-auto hide-scrollbar"
      data-tauri-drag-region
    >
      <div className="flex items-center min-w-0">
        {openTabs.map((tab) => (
          <Tab
            key={tab.id}
            tabId={tab.id}
            title={tab.title}
            isActive={tab.id === activeTabId}
            isDirty={tab.isDirty}
            onClose={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeTab(tab.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
