import {
  AlignBoxBottomLeftIcon,
  CodeIcon,
  Delete02Icon,
  Heading01Icon,
  Heading02Icon,
  Heading03Icon,
  ImageAdd01Icon,
  LeftToRightBlockQuoteIcon,
  Link01Icon,
  MoreHorizontalIcon,
  TableIcon,
  TextBoldIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  TextUnderlineIcon,
} from "@hugeicons/core-free-icons";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { NoteRecord } from "@/lib/types";
import { ToolbarButton } from "./ToolbarButton";

export function SelectionBubbleMenu({
  editor,
  onRequestPageLink,
  onRequestUrlImage,
  onRequestUrlLink,
}: {
  editor: Editor | null;
  notes: NoteRecord[];
  onRequestPageLink: () => void;
  onRequestUrlImage: () => void;
  onRequestUrlLink: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor, state }) =>
        editor.isEditable &&
        (!state.selection.empty || editor.isActive("table")) &&
        !editor.isActive("codeBlock")
      }
      updateDelay={80}
      options={{
        strategy: "fixed",
        placement: "top",
        offset: 8,
        flip: true,
        shift: { padding: 12 },
      }}
      appendTo={() => document.body}
      className="z-90 flex max-w-[min(420px,calc(100vw-24px))] items-center gap-0.5 rounded-2xl border border-line bg-panel/95 p-1 shadow-overlay backdrop-blur-[22px] dark:border-line-dark dark:bg-tooltip dark:text-tooltip-ink"
    >
      <ToolbarButton
        active={editor.isActive("bold")}
        icon={TextBoldIcon}
        label="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        active={editor.isActive("italic")}
        icon={TextItalicIcon}
        label="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        active={editor.isActive("link")}
        icon={Link01Icon}
        label="URL link"
        onClick={onRequestUrlLink}
      />
      <ToolbarButton
        icon={AlignBoxBottomLeftIcon}
        label="Page link"
        onClick={onRequestPageLink}
      />
      <ToolbarButton
        active={editor.isActive("strike")}
        icon={TextStrikethroughIcon}
        label="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        active={expanded}
        icon={MoreHorizontalIcon}
        label="More"
        onClick={() => setExpanded((value) => !value)}
      />
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            animate={{ scale: 1, width: "auto", x: 0 }}
            className="ml-1 flex items-center gap-0.5 overflow-hidden border-l border-line-soft pl-1 dark:border-line-soft-dark"
            exit={{ scale: 0.98, width: 0, x: -4 }}
            initial={{ scale: 0.98, width: 0, x: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            <ToolbarButton
              active={editor.isActive("heading", { level: 1 })}
              icon={Heading01Icon}
              label="Heading 1"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
            />
            <ToolbarButton
              active={editor.isActive("heading", { level: 2 })}
              icon={Heading02Icon}
              label="Heading 2"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            />
            <ToolbarButton
              active={editor.isActive("heading", { level: 3 })}
              icon={Heading03Icon}
              label="Heading 3"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            />
            <ToolbarButton
              active={editor.isActive("underline")}
              icon={TextUnderlineIcon}
              label="Underline"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            />
            <ToolbarButton
              active={editor.isActive("code")}
              icon={CodeIcon}
              label="Inline code"
              onClick={() => editor.chain().focus().toggleCode().run()}
            />
            <ToolbarButton
              active={editor.isActive("blockquote")}
              icon={LeftToRightBlockQuoteIcon}
              label="Quote"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            />
            <ToolbarButton
              icon={ImageAdd01Icon}
              label="Image"
              onClick={onRequestUrlImage}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {editor.isActive("table") && (
        <>
          <div className="mx-1 h-5 w-px bg-line-soft dark:bg-line-soft-dark" />
          <ToolbarButton
            icon={TableIcon}
            label="Add row"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          />
          <ToolbarButton
            icon={TableIcon}
            label="Add column"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          />
          <ToolbarButton
            icon={Delete02Icon}
            label="Delete row"
            onClick={() => editor.chain().focus().deleteRow().run()}
          />
          <ToolbarButton
            icon={Delete02Icon}
            label="Delete column"
            onClick={() => editor.chain().focus().deleteColumn().run()}
          />
          <ToolbarButton
            icon={Delete02Icon}
            label="Delete table"
            onClick={() => editor.chain().focus().deleteTable().run()}
          />
        </>
      )}
    </BubbleMenu>
  );
}
