import type { Editor } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Pilcrow,
  Table,
  TextQuote,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cx } from "@/lib/utils";

export interface SlashMenuState {
  query: string;
  range: { from: number; to: number };
  position: { left: number; top: number };
  side: "top" | "bottom";
}

interface SlashCommand {
  id: string;
  label: string;
  icon: LucideIcon;
  keywords: string;
  /** Edit to run on select. Omitted for special commands (e.g. note link). */
  run?: (editor: Editor) => void;
}

const commands: SlashCommand[] = [
  {
    id: "note-link",
    label: "Link to note",
    icon: Link2,
    keywords: "page link reference mention connect",
  },
  {
    id: "text",
    label: "Text",
    icon: Pilcrow,
    keywords: "paragraph plain",
    run: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    id: "h1",
    label: "Heading 1",
    icon: Heading1,
    keywords: "title big",
    run: (e) => e.chain().focus().setHeading({ level: 1 }).run(),
  },
  {
    id: "h2",
    label: "Heading 2",
    icon: Heading2,
    keywords: "subtitle section",
    run: (e) => e.chain().focus().setHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    label: "Heading 3",
    icon: Heading3,
    keywords: "subheading",
    run: (e) => e.chain().focus().setHeading({ level: 3 }).run(),
  },
  {
    id: "bullet",
    label: "Bullet list",
    icon: List,
    keywords: "unordered ul",
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: "numbered",
    label: "Numbered list",
    icon: ListOrdered,
    keywords: "ordered ol",
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "task",
    label: "Task list",
    icon: ListTodo,
    keywords: "todo checkbox check",
    run: (e) => e.chain().focus().toggleTaskList().run(),
  },
  {
    id: "quote",
    label: "Quote",
    icon: TextQuote,
    keywords: "blockquote",
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "code",
    label: "Code block",
    icon: Code,
    keywords: "snippet pre fence",
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "divider",
    label: "Divider",
    icon: Minus,
    keywords: "rule hr line separator",
    run: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    id: "table",
    label: "Table",
    icon: Table,
    keywords: "grid rows columns",
    run: (e) =>
      e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
];

export function SlashMenu({
  editor,
  menu,
  onClose,
  onLinkToNote,
}: {
  editor: Editor | null;
  menu: SlashMenuState | null;
  onClose: () => void;
  onLinkToNote: (range: { from: number; to: number }) => void;
}) {
  const [selected, setSelected] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const query = menu?.query.toLowerCase().trim() ?? "";
    if (!query) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.keywords}`.toLowerCase().includes(query),
    );
  }, [menu?.query]);

  useEffect(() => setSelected(0), [menu?.query]);

  useEffect(() => {
    menuRef.current
      ?.querySelector<HTMLElement>('[data-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  useEffect(() => {
    if (!menu || !editor) return;
    const execute = (command: SlashCommand) => {
      // The note-link command hands off to the picker, which owns deleting
      // the "/…" range and inserting the link.
      if (command.id === "note-link") {
        onLinkToNote(menu.range);
        onClose();
        return;
      }
      editor.chain().focus().deleteRange(menu.range).run();
      command.run?.(editor);
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === " ") {
        onClose();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (filtered.length === 0) return;
        setSelected((i) => (i + 1) % filtered.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (filtered.length === 0) return;
        setSelected((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const command = filtered[selected];
        if (command) execute(command);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [editor, filtered, menu, onClose, onLinkToNote, selected]);

  if (!menu || !editor || filtered.length === 0) return null;

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: menu.side === "bottom" ? -4 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className="fixed z-90 max-h-[264px] w-[208px] overflow-y-auto rounded-lg border border-line bg-bg p-1 shadow-lg shadow-black/8 dark:shadow-black/40"
      style={{ left: menu.position.left, top: menu.position.top }}
    >
      {filtered.map((command, index) => (
        <button
          key={command.id}
          type="button"
          data-selected={index === selected}
          className={cx(
            "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors duration-75",
            index === selected ? "bg-hover text-ink" : "text-muted",
          )}
          onMouseDown={(event) => {
            event.preventDefault();
            if (command.id === "note-link") {
              onLinkToNote(menu.range);
              onClose();
              return;
            }
            editor.chain().focus().deleteRange(menu.range).run();
            command.run?.(editor);
            onClose();
          }}
          onMouseEnter={() => setSelected(index)}
        >
          <command.icon size={14.5} strokeWidth={1.75} className="shrink-0" />
          {command.label}
        </button>
      ))}
    </motion.div>
  );
}
