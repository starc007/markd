import { FileText } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { flattenNotes } from "@/lib/tree";
import { relToLabel } from "@/lib/noteLinks";
import { cx, noteTitle, parentDir } from "@/lib/utils";
import { useVault } from "@/stores/vault";

export interface LinkPickerState {
  range: { from: number; to: number };
  position: { left: number; top: number };
  side: "top" | "bottom";
}

/** "projects/research/deep.md" → "projects / research" (undefined at root). */
function folderRoute(rel: string) {
  const dir = parentDir(rel);
  return dir ? dir.split("/").join(" / ") : undefined;
}

/** Floating search list to pick a note to link to. Inserts on select. */
export function NoteLinkPicker({
  state,
  currentRel,
  onPick,
  onClose,
}: {
  state: LinkPickerState;
  currentRel: string;
  onPick: (rel: string, title: string) => void;
  onClose: () => void;
}) {
  const tree = useVault((s) => s.tree);
  const recentNotes = useVault((s) => s.recentNotes);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Exclude the current note — no self-links.
  const notes = useMemo(
    () => flattenNotes(tree).filter((n) => n.rel !== currentRel),
    [tree, currentRel],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      // Typing searches the whole vault (title + folder path).
      return notes
        .filter((n) => n.rel.toLowerCase().includes(q))
        .slice(0, 8);
    }
    // Empty query: most-recent notes first, then fill from the rest.
    const byRel = new Map(notes.map((n) => [n.rel, n]));
    const recents = recentNotes
      .map((rel) => byRel.get(rel))
      .filter((n): n is (typeof notes)[number] => n !== undefined);
    const seen = new Set(recents.map((n) => n.rel));
    const rest = notes.filter((n) => !seen.has(n.rel));
    return [...recents, ...rest].slice(0, 8);
  }, [notes, recentNotes, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => setSelected(0), [query]);

  const choose = (index: number) => {
    const note = filtered[index];
    if (note) onPick(note.rel, relToLabel(note.rel, currentRel));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: state.side === "bottom" ? -4 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className="fixed z-90 w-[268px] rounded-lg border border-line bg-bg p-1 shadow-lg shadow-black/8 dark:shadow-black/40"
      style={{ left: state.position.left, top: state.position.top }}
    >
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Link to note…"
        className="mb-1 h-8 w-full bg-transparent px-2 text-[13px] text-ink outline-none placeholder:text-faint"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelected((i) => (i + 1) % Math.max(filtered.length, 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelected(
              (i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1),
            );
          } else if (event.key === "Enter") {
            event.preventDefault();
            choose(selected);
          }
        }}
        onBlur={onClose}
      />
      <div className="max-h-[240px] overflow-y-auto">
        {filtered.map((note, index) => {
          const route = folderRoute(note.rel);
          return (
            <button
              key={note.rel}
              type="button"
              className={cx(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors duration-75",
                index === selected ? "bg-hover text-ink" : "text-muted",
              )}
              // mousedown (not click) so it fires before the input's blur closes us
              onMouseDown={(event) => {
                event.preventDefault();
                choose(index);
              }}
              onMouseEnter={() => setSelected(index)}
            >
              <FileText size={14} strokeWidth={1.75} className="shrink-0" />
              <span className="truncate">{noteTitle(note.rel)}</span>
              {route && (
                <span className="ml-auto shrink-0 truncate pl-2 text-[11px] text-faint">
                  {route}
                </span>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-2 py-4 text-center text-[12.5px] text-faint">
            No notes match “{query.trim()}”
          </p>
        )}
      </div>
    </motion.div>
  );
}
