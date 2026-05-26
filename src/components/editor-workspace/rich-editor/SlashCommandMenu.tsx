import {
  CodeIcon,
  Heading01Icon,
  Heading02Icon,
  Heading03Icon,
  ImageAdd01Icon,
  LeftToRightBlockQuoteIcon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  ParagraphIcon,
  TableIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import type { Editor } from "@tiptap/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { cx } from "@/components/ui/utils";

export interface SlashMenuState {
  query: string;
  range: {
    from: number;
    to: number;
  };
  position: {
    left: number;
    top: number;
  };
  side: "top" | "bottom";
}

interface SlashCommand {
  id: string;
  label: string;
  detail: string;
  icon: IconSvgElement;
  keywords: string;
  run: (
    editor: Editor,
    onCreatePage: (title: string) => Promise<unknown>,
    onRequestPageLink: () => void,
    onRequestUrlImage: () => void,
  ) => void | Promise<void>;
}

const commands: SlashCommand[] = [
  {
    id: "paragraph",
    label: "Text",
    detail: "Plain writing block",
    icon: ParagraphIcon,
    keywords: "paragraph text normal",
    run: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: "h1",
    label: "Heading 1",
    detail: "Large section title",
    icon: Heading01Icon,
    keywords: "heading h1 title",
    run: (editor) => editor.chain().focus().setHeading({ level: 1 }).run(),
  },
  {
    id: "h2",
    label: "Heading 2",
    detail: "Medium section title",
    icon: Heading02Icon,
    keywords: "heading h2 subtitle",
    run: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    label: "Heading 3",
    detail: "Small section title",
    icon: Heading03Icon,
    keywords: "heading h3 subheading",
    run: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
  },
  {
    id: "bullet",
    label: "Bullet list",
    detail: "Simple unordered list",
    icon: LeftToRightListBulletIcon,
    keywords: "bullet list unordered",
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "number",
    label: "Numbered list",
    detail: "Ordered list",
    icon: LeftToRightListNumberIcon,
    keywords: "number ordered list",
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "task",
    label: "Task list",
    detail: "Checkbox items",
    icon: Task01Icon,
    keywords: "todo task checkbox check",
    run: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    id: "quote",
    label: "Quote",
    detail: "Call out a passage",
    icon: LeftToRightBlockQuoteIcon,
    keywords: "quote blockquote callout",
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "code",
    label: "Code block",
    detail: "Monospace fenced block",
    icon: CodeIcon,
    keywords: "code snippet pre",
    run: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "table",
    label: "Table",
    detail: "3 by 3 table",
    icon: TableIcon,
    keywords: "table grid rows columns",
    run: (editor) =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    id: "page-link",
    label: "Page link",
    detail: "Link another note",
    icon: Link01Icon,
    keywords: "page link note backlink",
    run: (_editor, _onCreatePage, onRequestPageLink) => onRequestPageLink(),
  },
  {
    id: "image",
    label: "Image",
    detail: "Embed from URL",
    icon: ImageAdd01Icon,
    keywords: "image picture media url",
    run: (_editor, _onCreatePage, _onRequestPageLink, onRequestUrlImage) =>
      onRequestUrlImage(),
  },
];

function commandScore(command: SlashCommand, query: string) {
  if (!query) return 1;
  const haystack = `${command.label} ${command.keywords}`.toLowerCase();
  if (haystack.includes(query)) return 100 - haystack.indexOf(query);

  let score = 0;
  let cursor = 0;
  for (const char of query) {
    const index = haystack.indexOf(char, cursor);
    if (index === -1) return 0;
    score += Math.max(1, 16 - (index - cursor));
    cursor = index + 1;
  }
  return score;
}

export function SlashCommandMenu({
  editor,
  menu,
  onCreatePage,
  onRequestPageLink,
  onRequestUrlImage,
  onClose,
}: {
  editor: Editor | null;
  menu: SlashMenuState | null;
  onCreatePage: (title: string) => Promise<unknown>;
  onRequestPageLink: () => void;
  onRequestUrlImage: () => void;
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const filteredCommands = useMemo(() => {
    const query = menu?.query.toLowerCase().trim() ?? "";
    return commands
      .map((command) => ({ command, score: commandScore(command, query) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.command);
  }, [menu?.query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [menu?.query]);

  useEffect(() => {
    if (!menu || !editor) return;

    const runSelected = async () => {
      const command = filteredCommands[selectedIndex];
      if (!command) return;
      editor.chain().focus().deleteRange(menu.range).run();
      await command.run(editor, onCreatePage, onRequestPageLink, onRequestUrlImage);
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (filteredCommands.length === 0) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((index) => (index + 1) % filteredCommands.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex(
          (index) =>
            (index - 1 + filteredCommands.length) % filteredCommands.length,
        );
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        runSelected();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [editor, filteredCommands, menu, onClose, selectedIndex]);

  const runCommand = async (command: SlashCommand) => {
    if (!editor || !menu) return;
    editor.chain().focus().deleteRange(menu.range).run();
    await command.run(editor, onCreatePage, onRequestPageLink, onRequestUrlImage);
    onClose();
  };

  return (
    <AnimatePresence>
      {menu && filteredCommands.length > 0 && (
        <motion.div
          animate={{ scale: 1, y: 0 }}
          className="fixed z-90 w-[248px] overflow-hidden rounded-2xl border border-line bg-panel/95 p-1 shadow-overlay backdrop-blur-[22px] dark:border-line-dark dark:bg-tooltip dark:text-tooltip-ink"
          exit={{ scale: 0.98, y: menu.side === "bottom" ? -6 : 6 }}
          initial={{ scale: 0.98, y: menu.side === "bottom" ? -6 : 6 }}
          style={{
            left: menu.position.left,
            top: menu.position.top,
            transformOrigin: menu.side === "bottom" ? "top left" : "bottom left",
          }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="px-2 pb-1 pt-1 text-[10px] font-medium uppercase tracking-wide text-muted dark:text-tooltip-ink/60">
            Blocks
          </div>
          <div className="max-h-56 overflow-y-auto pr-0.5">
            {filteredCommands.map((command, index) => (
              <button
                className={cx(
                  "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-[background-color,color,transform] duration-150",
                  index === selectedIndex
                    ? "translate-x-0.5 bg-hover text-ink dark:bg-tooltip-ink/10 dark:text-tooltip-ink"
                    : "text-muted hover:translate-x-0.5 hover:bg-hover hover:text-ink dark:text-tooltip-ink/70 dark:hover:bg-tooltip-ink/10 dark:hover:text-tooltip-ink",
                )}
                key={command.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  runCommand(command);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-panel-soft text-ink dark:bg-tooltip-ink/10 dark:text-tooltip-ink">
                  <HugeiconsIcon
                    icon={command.icon}
                    size={15}
                    color="currentColor"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-medium">
                    {command.label}
                  </span>
                  <span className="block truncate text-[11px] text-muted dark:text-tooltip-ink/55">
                    {command.detail}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
