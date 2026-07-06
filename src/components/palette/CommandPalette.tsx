import {
  Bookmark,
  CheckSquare,
  FilePlus,
  FileText,
  FolderOpen,
  Search,
  Settings,
  SunMoon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ipc } from "@/lib/ipc";
import type { SearchHit, TreeNode } from "@/lib/types";
import { cx } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useUi } from "@/stores/ui";
import { activeDir, useVault } from "@/stores/vault";

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
}

function flattenNotes(tree: TreeNode[], out: TreeNode[] = []) {
  for (const node of tree) {
    if (node.kind === "note") out.push(node);
    if (node.children) flattenNotes(node.children, out);
  }
  return out;
}

export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPaletteOpen);
  const status = useVault((s) => s.status);
  const tree = useVault((s) => s.tree);

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setHits([]);
      setSelected(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // content search, debounced
  useEffect(() => {
    if (!open || status !== "ready") return;
    const trimmed = query.trim();
    if (!trimmed) {
      setHits([]);
      return;
    }
    const timer = setTimeout(() => {
      ipc
        .searchNotes(trimmed, 12)
        .then(setHits)
        .catch(() => setHits([]));
    }, 120);
    return () => clearTimeout(timer);
  }, [query, open, status]);

  const close = () => setOpen(false);

  const items = useMemo<PaletteItem[]>(() => {
    const vault = useVault.getState();
    const ui = useUi.getState();
    const q = query.trim().toLowerCase();

    const actions: PaletteItem[] = [
      {
        id: "new-note",
        label: "New note",
        hint: "⌘N",
        icon: FilePlus,
        run: () => vault.createNote(activeDir(vault)),
      },
      {
        id: "todos",
        label: "Open Todos",
        icon: CheckSquare,
        run: () => vault.setView({ type: "todos" }),
      },
      {
        id: "bookmarks",
        label: "Open Bookmarks",
        icon: Bookmark,
        run: () => vault.setView({ type: "bookmarks" }),
      },
      {
        id: "theme",
        label: "Toggle appearance",
        icon: SunMoon,
        run: () => {
          const isDark = document.documentElement.classList.contains("dark");
          vault.setTheme(isDark ? "light" : "dark");
        },
      },
      {
        id: "settings",
        label: "Settings",
        hint: "⌘,",
        icon: Settings,
        run: () => ui.setSettingsOpen(true),
      },
      {
        id: "change-vault",
        label: "Change vault…",
        icon: FolderOpen,
        run: () => vault.chooseVault(),
      },
    ].filter((a) => !q || a.label.toLowerCase().includes(q));

    const noteItems: PaletteItem[] = q
      ? hits.map((hit) => ({
          id: `note-${hit.rel}`,
          label: hit.title,
          hint: hit.titleMatch ? undefined : hit.snippet,
          icon: FileText,
          run: () => {
            vault.expandTo(hit.rel);
            vault.setView({ type: "note", rel: hit.rel });
          },
        }))
      : flattenNotes(tree)
          .sort((a, b) => b.modifiedMs - a.modifiedMs)
          .slice(0, 6)
          .map((node) => ({
            id: `note-${node.rel}`,
            label: node.name,
            hint: "recent",
            icon: FileText,
            run: () => {
              vault.expandTo(node.rel);
              vault.setView({ type: "note", rel: node.rel });
            },
          }));

    return q ? [...noteItems, ...actions] : [...actions, ...noteItems];
  }, [query, hits, tree]);

  // Tracks whether the last selection change came from the keyboard. Only
  // keyboard nav scrolls the list — mouse selection must not, or the scroll
  // shifts rows under a stationary cursor and retriggers hover (flicker).
  const keyboardNav = useRef(false);

  useEffect(() => {
    keyboardNav.current = false;
    setSelected(0);
  }, [items.length, query]);

  useEffect(() => {
    if (!keyboardNav.current) return;
    listRef.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (status !== "ready" && open) {
    // no vault yet — palette has nothing to act on
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={close}
      align="top"
      className="mt-[16vh] w-[560px]"
    >
      <div>
        <div className="flex items-center gap-2.5 border-b border-line-soft px-4">
              <Search size={15} strokeWidth={2} className="shrink-0 text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notes and commands…"
                className="h-12 w-full bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    close();
                  } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    keyboardNav.current = true;
                    setSelected((i) => Math.min(i + 1, items.length - 1));
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    keyboardNav.current = true;
                    setSelected((i) => Math.max(i - 1, 0));
                  } else if (event.key === "Enter") {
                    event.preventDefault();
                    const item = items[selected];
                    if (item) {
                      close();
                      item.run();
                    }
                  }
                }}
              />
            </div>

            <div ref={listRef} className="max-h-[320px] overflow-y-auto p-1.5">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  data-selected={index === selected}
                  className={cx(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-ink transition-colors duration-75",
                    index === selected ? "bg-active" : "text-muted",
                  )}
                  onMouseMove={() => {
                    if (selected !== index) {
                      keyboardNav.current = false;
                      setSelected(index);
                    }
                  }}
                  onClick={() => {
                    close();
                    item.run();
                  }}
                >
                  <item.icon size={15} strokeWidth={1.75} className="shrink-0" />
                  <span className="shrink-0 text-[13.5px] font-medium">
                    {item.label}
                  </span>
                  {item.hint && (
                    <span className="min-w-0 flex-1 truncate text-right text-[11.5px] text-faint">
                      {item.hint}
                    </span>
                  )}
                </button>
              ))}
              {items.length === 0 && (
                <p className="px-3 py-8 text-center text-[13px] text-faint">
                  Nothing found for “{query.trim()}”
                </p>
              )}
            </div>
      </div>
    </Modal>
  );
}
