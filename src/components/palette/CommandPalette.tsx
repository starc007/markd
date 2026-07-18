import {
  Bookmark,
  CalendarDays,
  CheckSquare,
  Feather,
  FilePlus,
  FileText,
  Search,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Command } from "cmdk";
import { useEffect, useMemo, useRef, useState } from "react";
import { ipc } from "@/lib/ipc";
import { formatShortcutText } from "@/lib/shortcuts";
import { flattenNotes } from "@/lib/tree";
import type { SearchHit, TreeNode } from "@/lib/types";
import { cx, isMac, parentDir } from "@/lib/utils";
import { useShortcuts } from "@/stores/shortcuts";
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

/** "projects/research/deep.md" -> "projects / research" ("" for root notes). */
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
  const shortcuts = useShortcuts((s) => s.bindings);
  const mac = isMac();

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHits([]);
    setSearching(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // Content search is still owned by Rust; cmdk owns selection and activation.
  useEffect(() => {
    if (!open || status !== "ready") return;
    const trimmed = query.trim();
    if (!trimmed) {
      setHits([]);
      setSearching(false);
      return;
    }

    let disposed = false;
    setSearching(true);
    const timer = setTimeout(() => {
      ipc
        .searchNotes(trimmed, 12)
        .then((nextHits) => {
          if (!disposed) setHits(nextHits);
        })
        .catch(() => {
          if (!disposed) setHits([]);
        })
        .finally(() => {
          if (!disposed) setSearching(false);
        });
    }, 120);

    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [query, open, status]);

  const close = () => setOpen(false);

  // Defer the action past the next paint so close feedback can render before
  // heavier work such as mounting a fresh Tiptap editor.
  const runDeferred = (run: () => void) => {
    close();
    setTimeout(run, 0);
  };

  const trimmedQuery = query.trim();

  const actions = useMemo<PaletteItem[]>(() => {
    const vault = useVault.getState();
    const q = trimmedQuery.toLowerCase();

    return [
      {
        id: "new-note",
        label: "New note",
        hint: formatShortcutText(shortcuts.newNote, mac),
        icon: FilePlus,
        run: () => vault.createNote(activeDir(vault)),
      },
      {
        id: "quick-capture",
        label: "Quick capture",
        hint: mac ? "⌃⇧Space" : "Ctrl+Shift+Space",
        icon: Feather,
        run: () => void ipc.showQuickCapture(),
      },
      {
        id: "daily-note",
        label: "Open today's note",
        hint: formatShortcutText(shortcuts.dailyNote, mac),
        icon: CalendarDays,
        run: () => void vault.openDailyNote(),
      },
      {
        id: "todos",
        label: "Open Todos",
        hint: formatShortcutText(shortcuts.openTodos, mac),
        icon: CheckSquare,
        run: () => vault.setView({ type: "todos" }),
      },
      {
        id: "bookmarks",
        label: "Open Bookmarks",
        hint: formatShortcutText(shortcuts.openBookmarks, mac),
        icon: Bookmark,
        run: () => vault.setView({ type: "bookmarks" }),
      },
      {
        id: "settings",
        label: "Settings",
        hint: formatShortcutText(shortcuts.openSettings, mac),
        icon: Settings,
        run: () => useUi.getState().setSettingsOpen(true),
      },
    ].filter((action) => !q || action.label.toLowerCase().includes(q));
  }, [mac, shortcuts, trimmedQuery]);

  const recentItems = useMemo<PaletteItem[]>(() => {
    if (trimmedQuery) return [];
    const vault = useVault.getState();
    const byRel = new Map(flattenNotes(tree).map((node) => [node.rel, node]));

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
  }, [trimmedQuery, tree, recentNotes]);

  const searchItems = useMemo<PaletteItem[]>(() => {
    if (!trimmedQuery) return [];
    const vault = useVault.getState();

    return hits.map((hit) => ({
      id: `note-${hit.rel}`,
      label: hit.title,
      path: folderRoute(hit.rel),
      hint: hit.titleMatch ? undefined : hit.snippet,
      icon: FileText,
      run: () => {
        vault.expandTo(hit.rel);
        vault.setView({ type: "note", rel: hit.rel });
      },
    }));
  }, [trimmedQuery, hits]);

  const totalItems = trimmedQuery
    ? searchItems.length + actions.length
    : actions.length + recentItems.length;

  const renderItem = (item: PaletteItem) => {
    const Icon = item.icon;
    return (
      <Command.Item
        key={item.id}
        value={item.id}
        keywords={[item.label, item.path ?? "", item.hint ?? ""]}
        onSelect={() => runDeferred(item.run)}
        className={cx(
          "relative flex w-full min-w-0 items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-2 text-left text-muted transition-colors duration-75",
          "data-[selected=true]:bg-active data-[selected=true]:text-ink",
        )}
      >
        <Icon
          size={15}
          strokeWidth={1.75}
          className="shrink-0"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium leading-normal">
          {item.label}
        </span>
        {item.path && (
          <span className="min-w-0 max-w-[34%] shrink truncate text-[11.5px] leading-normal text-faint">
            {item.path}
          </span>
        )}
        {item.hint && (
          <span className="ml-auto min-w-0 max-w-[45%] shrink truncate pl-2 text-right text-[11.5px] text-faint">
            {item.hint}
          </span>
        )}
      </Command.Item>
    );
  };

  if (status !== "ready") return null;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      shouldFilter={false}
      loop
      overlayClassName="palette-overlay"
      contentClassName="palette-dialog"
      className="overflow-hidden rounded-xl bg-bg text-ink"
    >
      <div className="flex items-center gap-2.5 border-b border-line-soft px-4">
        <Search size={15} strokeWidth={2} className="shrink-0 text-faint" />
        <Command.Input
          ref={inputRef}
          value={query}
          onValueChange={setQuery}
          placeholder="Search notes and commands…"
          className="h-12 w-full bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
        />
      </div>

      <Command.List
        label="Command palette results"
        className="h-[320px] overflow-y-auto overflow-x-hidden p-1.5"
      >
        {trimmedQuery ? (
          <>
            {searchItems.map(renderItem)}
            {actions.map(renderItem)}
          </>
        ) : (
          <>
            {actions.map(renderItem)}
            {recentItems.length > 0 && (
              <Command.Group
                heading={
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
                    Recent
                  </span>
                }
                className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2"
              >
                {recentItems.map(renderItem)}
              </Command.Group>
            )}
          </>
        )}

        {searching && (
          <Command.Loading>
            <p className="px-3 py-8 text-center text-[13px] text-faint">
              Searching…
            </p>
          </Command.Loading>
        )}
        {!searching && totalItems === 0 && (
          <p className="px-3 py-8 text-center text-[13px] text-faint">
            Nothing found for “{trimmedQuery}”
          </p>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
