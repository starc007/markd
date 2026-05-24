import {
  AlignBoxBottomLeftIcon,
  CodeIcon,
  ImageAdd01Icon,
  LeftToRightBlockQuoteIcon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  TableIcon,
  Task01Icon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from "@hugeicons/core-free-icons";
import type { Editor } from "@tiptap/react";
import type { NoteRecord } from "@/lib/types";
import { ToolbarButton } from "./ToolbarButton";

export function EditorToolbar({
  editor,
  notes,
}: {
  editor: Editor | null;
  notes: NoteRecord[];
}) {
  if (!editor) return null;

  const insertPageLink = () => {
    const fallback = notes[0]?.title ?? "Untitled";
    const title = window.prompt("Link page", fallback);
    if (!title) return;
    editor.chain().focus().insertContent(`[[${title.trim()}]]`).run();
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Paste URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  };

  const insertImage = () => {
    const url = window.prompt("Image URL", "https://");
    if (!url) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <div className="sticky top-0 z-20 flex items-center gap-1 overflow-x-auto border-b border-line-soft bg-editor/85 px-[clamp(18px,5vw,64px)] py-2 backdrop-blur-[22px] dark:border-line-soft-dark dark:bg-editor-dark/85">
      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        icon={TextBoldIcon}
        label="Heading"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
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
        active={editor.isActive("underline")}
        icon={TextUnderlineIcon}
        label="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        active={editor.isActive("bulletList")}
        icon={LeftToRightListBulletIcon}
        label="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        active={editor.isActive("orderedList")}
        icon={LeftToRightListNumberIcon}
        label="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        active={editor.isActive("taskList")}
        icon={Task01Icon}
        label="Task list"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      />
      <ToolbarButton
        active={editor.isActive("blockquote")}
        icon={LeftToRightBlockQuoteIcon}
        label="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        active={editor.isActive("codeBlock")}
        icon={CodeIcon}
        label="Code block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />
      <div className="mx-1 h-5 w-px bg-line-soft dark:bg-line-soft-dark" />
      <ToolbarButton icon={AlignBoxBottomLeftIcon} label="Page link" onClick={insertPageLink} />
      <ToolbarButton
        active={editor.isActive("link")}
        icon={Link01Icon}
        label="URL link"
        onClick={setLink}
      />
      <ToolbarButton icon={ImageAdd01Icon} label="Image" onClick={insertImage} />
      <ToolbarButton icon={TableIcon} label="Table" onClick={insertTable} />
    </div>
  );
}
