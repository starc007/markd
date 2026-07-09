import {
  Bookmark,
  CheckSquare,
  FilePlus,
  FileText,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ipc } from "@/lib/ipc";
import { SPRING_LAYOUT } from "@/lib/ease";
import { flattenNotes } from "@/lib/tree";
import type { SearchHit, TreeNode } from "@/lib/types";
import { cx, parentDir } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useUi } from "@/stores/ui";
import { activeDir, useVault } from "@/stores/vault";

interface PaletteItem {
  id: string;
  label: string;
  /** Dim breadcrumb of the containing folder, e.g. "projects / research". */
  path?: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
}

/** "projects/research/deep.md" → "projects / research" ("" for root notes). */
function folderRoute(rel: string) {
  const dir = parentDir(rel);
  return dir ? dir.split("/").join(" / ") : undefined;
}

export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPaletteOpen);
  const status = useVault((s) => s.status);
  const tree = useVault((s) => s.tree);
  const recentNotes = useVault((s) => s.recentNotes);

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

  // Defer the action past the next paint so the close animation is actually
  // visible before any heavy work it triggers (e.g. mounting a fresh Tiptap
  // editor) blocks the main thread. rAF fires *before* paint, so it doesn't
  // help here — a macrotask does.
  const runDeferred = (run: () => void) => {
    close();
    setTimeout(run, 0);
  };

  const items = useMemo<PaletteItem[]>(() => {
    const vault = useVault.getState();
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
    ].filter((a) => !q || a.label.toLowerCase().includes(q));

    const noteItems: PaletteItem[] = q
      ? hits.map((hit) => ({
          id: `note-${hit.rel}`,
          label: hit.title,
          path: folderRoute(hit.rel),
          hint: hit.titleMatch ? undefined : hit.snippet,
          icon: FileText,
          run: () => {
            vault.expandTo(hit.rel);
            vault.setView({ type: "note", rel: hit.rel });
          },
        }))
      : (() => {
          const byRel = new Map(
            flattenNotes(tree).map((node) => [node.rel, node]),
          );
          return recentNotes
            .map((rel) => byRel.get(rel))
            .filter((node): node is TreeNode => node !== undefined)
            .slice(0, 6)
            .map((node) => ({
              id: `note-${node.rel}`,
              label: node.name,
              path: folderRoute(node.rel),
              icon: FileText,
              run: () => {
                vault.expandTo(node.rel);
                vault.setView({ type: "note", rel: node.rel });
              },
            }));
        })();

    return q ? [...noteItems, ...actions] : [...actions, ...noteItems];
  }, [query, hits, tree, recentNotes]);

  // Index where the "Recent" section starts (no query only), for the header.
  const recentStart = query.trim()
    ? -1
    : items.findIndex((i) => i.id.startsWith("note-"));

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
                    if (item) runDeferred(item.run);
                  }
                }}
              />
            </div>

            <motion.div
              ref={listRef}
              layoutRoot
              className="max-h-[320px] overflow-y-auto p-1.5"
            >
              {items.map((item, index) => (
                <Fragment key={item.id}>
                  {index === recentStart && (
                    <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
                      Recent
                    </p>
                  )}
                  <button
                    type="button"
                    data-selected={index === selected}
                    className={cx(
                      "relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-75",
                      index === selected ? "text-ink" : "text-muted",
                    )}
                    onMouseMove={() => {
                      if (selected !== index) {
                        keyboardNav.current = false;
                        setSelected(index);
                      }
                    }}
                    onClick={() => runDeferred(item.run)}
                  >
                    {index === selected && (
                      <motion.div
                        layoutId="palette-active"
                        transition={SPRING_LAYOUT}
                        className="absolute inset-0 rounded-lg bg-active"
                      />
                    )}
                    <item.icon
                      size={15}
                      strokeWidth={1.75}
                      className="relative z-10 shrink-0"
                    />
                    <span className="relative z-10 max-w-[55%] shrink-0 truncate text-[13.5px] font-medium leading-normal">
                      {item.label}
                    </span>
                    {item.path && (
                      <span className="relative z-10 min-w-0 shrink truncate text-[11.5px] leading-normal text-faint">
                        {item.path}
                      </span>
                    )}
                    {item.hint && (
                      <span className="relative z-10 ml-auto min-w-0 shrink-0 truncate pl-2 text-right text-[11.5px] text-faint">
                        {item.hint}
                      </span>
                    )}
                  </button>
                </Fragment>
              ))}
              {items.length === 0 && (
                <p className="px-3 py-8 text-center text-[13px] text-faint">
                  Nothing found for “{query.trim()}”
                </p>
              )}
            </motion.div>
      </div>
    </Modal>
  );
}
