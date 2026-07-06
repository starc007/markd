import { PanelLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { BookmarksPage } from "@/components/bookmarks/BookmarksPage";
import { TodosPage } from "@/components/todos/TodosPage";
import { EASE_OUT, SPRING_PANEL } from "@/lib/ease";
import { ActionSwapText } from "@/components/motion/action-swap";
import { Sidebar } from "./Sidebar";
import { Tooltip } from "@/components/ui/Tooltip";
import { useUi } from "@/stores/ui";
import { useVault } from "@/stores/vault";

const SIDEBAR_WIDTH = 240;

/** Stable key per view so AnimatePresence cross-fades on switch. */
function viewKey(view: ReturnType<typeof useVault.getState>["view"]) {
  if (!view) return "empty";
  return view.type === "note" ? `note:${view.rel}` : view.type;
}

export function AppShell() {
  const view = useVault((s) => s.view);
  const sidebarHidden = useUi((s) => s.sidebarHidden);
  const toggleSidebar = useUi((s) => s.toggleSidebar);

  return (
    <div className="flex h-full bg-bg">
      {/* Collapse by animating width (spring) with the panel clipped at a
          fixed inner width — slides cleanly, no content reflow-jitter. */}
      <motion.div
        animate={{ width: sidebarHidden ? 0 : SIDEBAR_WIDTH }}
        initial={false}
        transition={SPRING_PANEL}
        className="h-full shrink-0 overflow-hidden"
      >
        <div style={{ width: SIDEBAR_WIDTH }} className="h-full">
          <Sidebar />
        </div>
      </motion.div>

      <main className="relative flex min-w-0 flex-1 flex-col">
        <motion.div
          data-tauri-drag-region
          className="flex h-12 shrink-0 items-center"
          animate={{ paddingLeft: sidebarHidden ? 84 : 12 }}
          initial={false}
          transition={SPRING_PANEL}
        >
          <Tooltip label="Toggle sidebar ⌘\" side="right">
            <button
              type="button"
              onClick={toggleSidebar}
              className="grid h-7 w-7 place-items-center rounded-md text-faint transition-colors duration-100 hover:bg-hover hover:text-ink"
            >
              <PanelLeft size={15.5} strokeWidth={1.75} />
            </button>
          </Tooltip>
          <ActionSwapText
            value={view?.type ?? "none"}
            animation="cascade"
            className="ml-1 text-[13px] font-medium text-ink"
          >
            {view?.type === "todos"
              ? "Todos"
              : view?.type === "bookmarks"
                ? "Bookmarks"
                : ""}
          </ActionSwapText>
        </motion.div>

        <div className="relative min-h-0 flex-1">
          <AnimatePresence initial={false}>
            <motion.div
              key={viewKey(view)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="absolute inset-0"
            >
              {view?.type === "note" && <NoteEditor rel={view.rel} />}
              {view?.type === "todos" && <TodosPage />}
              {view?.type === "bookmarks" && <BookmarksPage />}
              {!view && <EmptyState />}
            </motion.div>
          </AnimatePresence>
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
