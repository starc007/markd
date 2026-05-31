import { Dialog, DialogPanel } from "@headlessui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Bookmark01Icon,
  FileEditIcon,
  FolderAddIcon,
  Search01Icon,
  Settings02Icon,
  StickyNote01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { cx } from "@/components/ui";
import type { SearchNoteResult, ViewMode } from "@/lib/types";
import * as api from "@/lib/workspace-api";
import { useWorkspaceStore } from "@/stores/workspace";

const MotionDialogPanel = motion.create(DialogPanel);

type CommandItem = {
  id: string;
  group: string;
  label: string;
  detail?: string;
  shortcut?: string;
  icon: typeof Add01Icon;
  run: () => void | Promise<void>;
};

function commandMatches(item: CommandItem, query: string) {
  if (!query) return true;
  const haystack = `${item.label} ${item.detail ?? ""} ${item.group}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((part) => haystack.includes(part));
}

function noteDetail(result: SearchNoteResult) {
  if (result.snippet) return result.snippet;
  return result.note.path.replace(/^notes\//, "");
}

export function CommandBar() {
  const open = useWorkspaceStore((state) => state.commandOpen);
  const setOpen = useWorkspaceStore((state) => state.setCommandOpen);
  const manifest = useWorkspaceStore((state) => state.manifest);
  const openNote = useWorkspaceStore((state) => state.openNote);
  const createNote = useWorkspaceStore((state) => state.createNote);
  const createFolder = useWorkspaceStore((state) => state.createFolder);
  const saveSticky = useWorkspaceStore((state) => state.saveSticky);
  const setView = useWorkspaceStore((state) => state.setView);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [noteResults, setNoteResults] = useState<SearchNoteResult[]>([]);
  const requestIdRef = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, [setOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        createNote();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [createNote, setOpen]);

  useEffect(() => {
    if (!open) return;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const timeout = window.setTimeout(async () => {
      const results = await api.searchNotes(query, query.trim() ? 24 : 10);
      if (requestIdRef.current === requestId) setNoteResults(results);
    }, query.trim() ? 90 : 0);

    return () => window.clearTimeout(timeout);
  }, [open, query]);

  const viewCommand = useCallback(
    (view: ViewMode) => {
      setView(view);
      close();
    },
    [close, setView],
  );

  const baseCommands = useMemo<CommandItem[]>(
    () => [
      {
        id: "create-note",
        group: "Create",
        label: "New note",
        detail: "Create a Markdown note",
        shortcut: "⌘N",
        icon: Add01Icon,
        run: async () => {
          await createNote();
          close();
        },
      },
      {
        id: "create-folder",
        group: "Create",
        label: "New folder",
        detail: "Create a folder at workspace root",
        icon: FolderAddIcon,
        run: async () => {
          await createFolder();
          close();
        },
      },
      {
        id: "create-sticky",
        group: "Create",
        label: "New sticky",
        detail: "Capture a quick Markdown note",
        icon: StickyNote01Icon,
        run: async () => {
          await saveSticky({ content: "", color: "butter" });
          setView("stickies");
          close();
        },
      },
      {
        id: "view-tasks",
        group: "Go to",
        label: "Tasks",
        detail: "Open task inbox",
        icon: Task01Icon,
        run: () => viewCommand("todos"),
      },
      {
        id: "view-bookmarks",
        group: "Go to",
        label: "Bookmarks",
        detail: "Open saved links",
        icon: Bookmark01Icon,
        run: () => viewCommand("bookmarks"),
      },
      {
        id: "view-stickies",
        group: "Go to",
        label: "Sticky notes",
        detail: "Open quick notes",
        icon: StickyNote01Icon,
        run: () => viewCommand("stickies"),
      },
      {
        id: "view-settings",
        group: "Go to",
        label: "Settings",
        detail: "Workspace and appearance",
        icon: Settings02Icon,
        run: () => viewCommand("settings"),
      },
    ],
    [close, createFolder, createNote, saveSticky, setView, viewCommand],
  );

  const commands = useMemo(() => {
    const normalized = query.trim();
    const actionItems = baseCommands.filter((item) =>
      commandMatches(item, normalized),
    );
    const noteItems = noteResults.map<CommandItem>((result) => ({
      id: `note-${result.note.id}`,
      group: "Notes",
      label: result.note.title,
      detail: noteDetail(result),
      icon: FileEditIcon,
      run: async () => {
        await openNote(result.note.id);
        close();
      },
    }));
    return [...actionItems, ...noteItems];
  }, [baseCommands, close, noteResults, openNote, query]);

  useEffect(() => {
    if (!open) return;
    setSelectedIndex(0);
  }, [commands.length, open, query]);

  const runSelected = () => {
    void commands[selectedIndex]?.run();
  };

  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % Math.max(commands.length, 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex(
        (index) => (index - 1 + Math.max(commands.length, 1)) % Math.max(commands.length, 1),
      );
    }

    if (event.key === "Enter") {
      event.preventDefault();
      runSelected();
    }
  };

  const grouped = commands.reduce<Array<{ group: string; items: CommandItem[] }>>(
    (groups, item) => {
      const existing = groups.find((group) => group.group === item.group);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ group: item.group, items: [item] });
      }
      return groups;
    },
    [],
  );

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <Dialog static open={open} onClose={close} className="relative z-70">
          <motion.div
            className="fixed inset-0 bg-overlay-backdrop backdrop-blur-lg dark:bg-overlay-backdrop-dark"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="fixed inset-0 grid place-items-start justify-center p-5 pt-[16vh]">
            <MotionDialogPanel
              initial={{ opacity: 0, scale: 0.97, y: 14, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.98, y: 10, filter: "blur(8px)" }}
              transition={{ type: "spring", stiffness: 460, damping: 36 }}
              className="w-[min(500px,calc(100vw-40px))] overflow-hidden rounded-2xl border border-line bg-panel/95 p-1.5 text-ink shadow-overlay backdrop-blur-[22px] dark:border-line-dark dark:bg-tooltip dark:text-tooltip-ink"
            >
              <div className="flex items-center gap-2 px-2.5 pb-2.5 pt-2">
                <HugeiconsIcon icon={Search01Icon} size={16} color="currentColor" />
                <input
                  autoFocus
                  autoCapitalize="off"
                  autoCorrect="off"
                  className="h-8 w-full border-0 bg-transparent text-sm text-inherit outline-none placeholder:text-muted dark:placeholder:text-tooltip-ink/45"
                  data-enable-grammarly="false"
                  data-gramm="false"
                  data-gramm_editor="false"
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Search notes or run a command..."
                  spellCheck={false}
                  value={query}
                />
              </div>
              <div className="mt-1 max-h-[360px] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {grouped.map((group) => (
                  <div className="pb-1" key={group.group}>
                    <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted dark:text-tooltip-ink/45">
                      {group.group}
                    </div>
                    {group.items.map((item) => {
                      flatIndex += 1;
                      const currentIndex = flatIndex;
                      return (
                        <button
                          key={item.id}
                          className={cx(
                            "relative flex w-full items-center gap-2 rounded-xl border-0 bg-transparent px-2 py-1.5 text-left text-sm transition-colors hover:bg-hover dark:hover:bg-tooltip-ink/10",
                            selectedIndex === currentIndex &&
                              "bg-hover text-ink dark:bg-tooltip-ink/10 dark:text-tooltip-ink",
                          )}
                          onClick={() => void item.run()}
                          onMouseEnter={() => setSelectedIndex(currentIndex)}
                          type="button"
                        >
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-panel-soft dark:bg-tooltip-ink/10">
                            <HugeiconsIcon icon={item.icon} size={15} color="currentColor" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{item.label}</span>
                            {item.detail && (
                              <span className="block truncate text-[11px] text-muted dark:text-tooltip-ink/55">
                                {item.detail}
                              </span>
                            )}
                          </span>
                          {item.shortcut && (
                            <kbd className="ml-auto text-[11px] text-muted dark:text-tooltip-ink/55">
                              {item.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
                {commands.length === 0 && (
                  <div className="px-3 py-8 text-center text-sm text-muted dark:text-tooltip-ink/55">
                    No commands or notes found
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 border-t border-line-soft px-3 py-2 text-[11px] text-muted dark:border-tooltip-ink/10 dark:text-tooltip-ink/50">
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
                <span>Esc Close</span>
                <span className="ml-auto">{manifest?.notes.length ?? 0} notes</span>
              </div>
            </MotionDialogPanel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
