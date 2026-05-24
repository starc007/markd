import { useTabStore } from "@/stores/tabStore";
import { Tab } from "./Tab";

export function TabBar() {
  const { openTabs, activeTabId, closeTab } = useTabStore();

  if (openTabs.length === 0) {
    return null;
  }

  return (
    <div
      className="mx-4 mt-3 flex h-11 items-center rounded-[18px] border border-white/45 bg-white/36 p-1 overflow-x-auto hide-scrollbar backdrop-blur-2xl dark:border-white/10 dark:bg-white/6"
      data-tauri-drag-region
    >
      <div className="flex items-center gap-1 min-w-0">
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
