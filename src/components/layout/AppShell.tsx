import { PanelLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { BookmarksPage } from "@/components/bookmarks/BookmarksPage";
import { TodosPage } from "@/components/todos/TodosPage";
import { Sidebar } from "./Sidebar";
import { useUi } from "@/stores/ui";
import { useVault } from "@/stores/vault";

export function AppShell() {
  const view = useVault((s) => s.view);
  const sidebarHidden = useUi((s) => s.sidebarHidden);
  const toggleSidebar = useUi((s) => s.toggleSidebar);

  return (
    <div className="flex h-full bg-bg">
      <AnimatePresence initial={false}>
        {!sidebarHidden && (
          <motion.div
            initial={{ marginLeft: -240 }}
            animate={{ marginLeft: 0 }}
            exit={{ marginLeft: -240 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative flex min-w-0 flex-1 flex-col">
        <div
          data-tauri-drag-region
          className="flex h-12 shrink-0 items-center"
          style={{ paddingLeft: sidebarHidden ? 84 : 12 }}
        >
          <button
            type="button"
            aria-label="Toggle sidebar"
            title="Toggle sidebar (⌘\)"
            onClick={toggleSidebar}
            className="grid h-7 w-7 place-items-center rounded-md text-faint transition-colors duration-100 hover:bg-hover hover:text-ink"
          >
            <PanelLeft size={15.5} strokeWidth={1.75} />
          </button>
        </div>

        <div className="min-h-0 flex-1">
          {view?.type === "note" && <NoteEditor key={view.rel} rel={view.rel} />}
          {view?.type === "todos" && <TodosPage />}
          {view?.type === "bookmarks" && <BookmarksPage />}
          {!view && <EmptyState />}
        </div>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 pb-24">
      <p className="text-[15px] text-faint">No note open</p>
      <p className="text-[12.5px] text-faint">
        <kbd className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[10.5px]">
          ⌘K
        </kbd>{" "}
        to find or create
      </p>
    </div>
  );
}
