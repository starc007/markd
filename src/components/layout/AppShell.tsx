import { Check, Copy, Download, FileCode2, FilePlus, MoreHorizontal, PanelLeft, Search, Tag, Trash2, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { NoteBreadcrumb } from "@/components/editor/NoteBreadcrumb";
import { NotesWorkspace } from "@/components/editor/NotesWorkspace";
import { TabBar } from "@/components/editor/TabBar";
import { BookmarksPage } from "@/components/bookmarks/BookmarksPage";
import { TodosPage } from "@/components/todos/TodosPage";
import { EASE_OUT, SPRING_LAYOUT, SPRING_PANEL } from "@/lib/ease";
import { cx } from "@/lib/utils";
import { ActionSwapText } from "@/components/motion/action-swap";
import { Sidebar } from "./Sidebar";
import { CopyButton } from "@/components/ui/CopyButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { ContextMenu, type MenuPosition } from "@/components/ui/ContextMenu";
import { useBookmarks } from "@/stores/bookmarks";
import { useTodos } from "@/stores/todos";
import { useUi } from "@/stores/ui";
import { useVault } from "@/stores/vault";

const SIDEBAR_WIDTH = 240;

/** Absolute on-disk path for the current view — handy to hand to an agent. */
function viewPath(
  root: string,
  view: ReturnType<typeof useVault.getState>["view"],
): string | null {
  if (!root || !view) return null;
  if (view.type === "note") return `${root}/notes/${view.rel}`;
  if (view.type === "todos") return `${root}/.markd/todos.json`;
  if (view.type === "bookmarks") return `${root}/.markd/bookmarks.json`;
  return null;
}

export function AppShell() {
  const view = useVault((s) => s.view);
  const root = useVault((s) => s.root);
  const sidebarHidden = useUi((s) => s.sidebarHidden);
  const markdownSource = useUi((s) => s.markdownSource);
  const toggleSidebar = useUi((s) => s.toggleSidebar);
  const toggleMarkdownSource = useUi((s) => s.toggleMarkdownSource);
  const createBookmarkTag = useBookmarks((s) => s.createTag);
  const exportBookmarks = useBookmarks((s) => s.exportAll);
  const createTodoTag = useTodos((s) => s.createTag);
  const [noteMenu, setNoteMenu] = useState<MenuPosition | null>(null);

  const path = viewPath(root, view);

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
        {/* Row 1 — titlebar: sidebar toggle + open-note tabs. The strip is
            recessed (panel); the active tab takes the content bg so it reads
            as merged with the pane below, code-editor style. */}
        <motion.div
          data-tauri-drag-region
          className="flex h-11 shrink-0 items-stretch gap-1.5 bg-sunken pr-3"
          animate={{ paddingLeft: sidebarHidden ? 84 : 10 }}
          initial={false}
          transition={SPRING_PANEL}
        >
          <div className="flex shrink-0 items-center">
            <Tooltip label="Toggle sidebar ⌘\" side="right">
              <button
                type="button"
                onClick={toggleSidebar}
                className="grid h-7 w-7 place-items-center rounded-md text-faint transition-colors duration-100 hover:bg-hover hover:text-ink"
              >
                <PanelLeft size={15.5} strokeWidth={1.75} />
              </button>
            </Tooltip>
          </div>
          <TabBar />
        </motion.div>

        {/* Row 2 — current view title + right-side actions. */}
        <div className="flex h-10 bg-transparent shrink-0 items-center px-3">
          {view?.type === "note" ? (
            <NoteBreadcrumb rel={view.rel} />
          ) : (
            <ActionSwapText
              value={view?.type ?? "none"}
              animation="cascade"
              className="text-[14px] font-semibold text-ink"
            >
              {view?.type === "todos"
                ? "Todos"
                : view?.type === "bookmarks"
                  ? "Bookmarks"
                  : ""}
            </ActionSwapText>
          )}

          <LayoutGroup>
            <div className="ml-auto flex items-center gap-2">
              {view?.type === "note" && (
                <>
                  <Tooltip
                    label={markdownSource ? "Show rich editor" : "Show Markdown source"}
                    side="bottom"
                  >
                    <button
                      type="button"
                      aria-pressed={markdownSource}
                      onClick={toggleMarkdownSource}
                      className={cx(
                        "grid h-7 w-7 place-items-center rounded-md border transition-colors duration-100",
                        markdownSource
                          ? "border-invert bg-invert text-invert-ink"
                          : "border-line bg-hover text-muted hover:bg-active hover:text-ink",
                      )}
                    >
                      <FileCode2 size={14} strokeWidth={1.9} />
                    </button>
                  </Tooltip>
                  <Tooltip label="Note actions" side="bottom">
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={noteMenu !== null}
                      onClick={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        setNoteMenu({ x: rect.right, y: rect.bottom + 4 });
                      }}
                      className="grid h-7 w-7 place-items-center rounded-md border border-line bg-hover text-muted transition-colors duration-100 hover:bg-active hover:text-ink"
                    >
                      <MoreHorizontal size={15} strokeWidth={2} />
                    </button>
                  </Tooltip>
                </>
              )}
              {path && (
                <motion.div layout transition={SPRING_LAYOUT}>
                  <CopyButton
                    value={path}
                    text="Copy path"
                    copiedText="Copied"
                  />
                </motion.div>
              )}
              {view?.type === "bookmarks" && (
                <>
                  <Tooltip label="Export as markdown" side="bottom">
                    <button
                      type="button"
                      onClick={exportBookmarks}
                      className="inline-flex h-7 select-none items-center gap-1.5 rounded-md border border-line bg-hover px-2.5 text-[12.5px] font-medium text-ink transition-colors duration-100 hover:bg-active"
                    >
                      <Download size={13} strokeWidth={2} />
                      Export
                    </button>
                  </Tooltip>
                  <NewTagButton onCreate={createBookmarkTag} />
                </>
              )}
              {view?.type === "todos" && (
                <NewTagButton onCreate={createTodoTag} />
              )}
            </div>
          </LayoutGroup>
          {noteMenu && view?.type === "note" && (
            <ContextMenu
              position={noteMenu}
              onClose={() => setNoteMenu(null)}
              items={[
                {
                  label: "Export as Markdown",
                  icon: Download,
                  onSelect: () => dispatchNoteAction("export"),
                },
                {
                  label: "Copy Markdown",
                  icon: Copy,
                  onSelect: () => dispatchNoteAction("copy"),
                },
                {
                  label: "Delete note",
                  icon: Trash2,
                  danger: true,
                  onSelect: () => dispatchNoteAction("delete"),
                },
              ]}
            />
          )}
        </div>

        <div className="relative min-h-0 flex-1">
          {/* Workspace stays mounted (hidden) across view switches — open
              tabs keep their live editors, so returning to notes is instant. */}
          <NotesWorkspace visible={view?.type === "note"} />
          {view?.type === "todos" && (
            <div className="absolute inset-0">
              <TodosPage />
            </div>
          )}
          {view?.type === "bookmarks" && (
            <div className="absolute inset-0">
              <BookmarksPage />
            </div>
          )}
          {!view && <EmptyState />}
        </div>
      </main>
    </div>
  );
}

type NoteAction = "export" | "copy" | "delete";

function dispatchNoteAction(action: NoteAction) {
  window.dispatchEvent(
    new CustomEvent("markd:note-action", { detail: { action } }),
  );
}

function NewTagButton({ onCreate }: { onCreate: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const commit = () => {
    const value = inputRef.current?.value.trim();
    if (value) onCreate(value);
    setOpen(false);
  };

  return (
    <div>
      {/* Single morphing pill: the container reshapes (layout spring) while its
          contents cross-fade, so button → input feels like one object. */}
      <motion.div
        layout
        transition={SPRING_LAYOUT}
        className="flex h-7 items-center overflow-hidden rounded-md border border-line bg-hover"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <motion.div
              key="form"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: EASE_OUT }}
              className="flex items-center pl-2 pr-1"
            >
              <input
                ref={inputRef}
                placeholder="Tag name…"
                className="w-28 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-faint"
                onKeyDown={(event) => {
                  if (event.key === "Enter") commit();
                  if (event.key === "Escape") setOpen(false);
                }}
              />
              <Tooltip label="Save ↵" side="bottom">
                <button
                  type="button"
                  onClick={commit}
                  className="grid h-5 w-5 place-items-center rounded text-faint transition-colors duration-100 hover:bg-hover hover:text-ink"
                >
                  <Check size={13} strokeWidth={2.25} />
                </button>
              </Tooltip>
              <Tooltip label="Cancel esc" side="bottom">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-5 w-5 place-items-center rounded text-faint transition-colors duration-100 hover:bg-hover hover:text-ink"
                >
                  <X size={13} strokeWidth={2.25} />
                </button>
              </Tooltip>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              layout
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: EASE_OUT }}
              onClick={() => setOpen(true)}
              className="flex h-7 select-none items-center gap-1.5 px-2.5 text-[12.5px] font-medium text-ink transition-colors duration-100 hover:bg-hover"
            >
              <Tag size={13} strokeWidth={2} />
              New tag
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function HashMark() {
  return (
    <div className="grid h-16 w-16 place-items-center rounded-2xl border border-line-soft bg-panel">
      <svg width="34" height="34" viewBox="0 0 1024 1024" fill="none" aria-hidden="true">
        <g
          stroke="var(--faint)"
          strokeWidth="84"
          strokeLinecap="round"
        >
          <line x1="390" y1="280" x2="390" y2="744" />
          <line x1="634" y1="280" x2="634" y2="744" />
          <line x1="280" y1="390" x2="744" y2="390" />
          <line x1="280" y1="634" x2="744" y2="634" />
        </g>
      </svg>
    </div>
  );
}

function EmptyAction({
  icon,
  label,
  keys,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  keys: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-[13px] font-medium text-muted transition-colors duration-100 hover:bg-hover hover:text-ink"
    >
      {icon}
      {label}
      <kbd className="ml-1 rounded border border-line bg-bg px-1.5 py-0.5 font-mono text-[10.5px] text-faint">
        {keys}
      </kbd>
    </button>
  );
}

function EmptyState() {
  const setPaletteOpen = useUi((s) => s.setPaletteOpen);
  const createNote = useVault((s) => s.createNote);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 pb-24">
      <HashMark />
      <div className="text-center">
        <p className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
          Nothing open yet
        </p>
        <p className="mt-1 text-[13px] text-faint">
          Jump to a note, or start something new.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <EmptyAction
          icon={<Search size={14} strokeWidth={2} />}
          label="Search"
          keys="⌘K"
          onClick={() => setPaletteOpen(true)}
        />
        <EmptyAction
          icon={<FilePlus size={14} strokeWidth={2} />}
          label="New note"
          keys="⌘N"
          onClick={() => createNote("")}
        />
      </div>
    </div>
  );
}
