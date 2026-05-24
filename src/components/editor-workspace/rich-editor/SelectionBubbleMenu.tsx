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
  TableIcon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from "@hugeicons/core-free-icons";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { NoteRecord } from "@/lib/types";
import { ToolbarButton } from "./ToolbarButton";

export function SelectionBubbleMenu({
  editor,
  notes,
  onCreatePage,
}: {
  editor: Editor | null;
  notes: NoteRecord[];
  onCreatePage: (title: string) => Promise<unknown>;
}) {
  if (!editor) return null;

  const insertPageLink = async () => {
    const fallback = notes[0]?.title ?? "Untitled";
    const title = window.prompt("Link page", fallback);
    if (!title) return;
    const pageTitle = title.trim();
    if (!notes.some((note) => note.title.toLowerCase() === pageTitle.toLowerCase())) {
      await onCreatePage(pageTitle);
    }
    editor.chain().focus().insertContent(`[[${pageTitle}]]`).run();
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
        placement: "top",
        offset: 8,
      }}
      className="flex items-center gap-1 rounded-2xl border border-line bg-panel/90 p-1.5 shadow-overlay backdrop-blur-[22px] dark:border-line-dark dark:bg-panel-dark/90"
    >
      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        icon={Heading01Icon}
        label="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        icon={Heading02Icon}
        label="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        icon={Heading03Icon}
        label="Heading 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <div className="mx-1 h-5 w-px bg-line-soft dark:bg-line-soft-dark" />
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
      <div className="mx-1 h-5 w-px bg-line-soft dark:bg-line-soft-dark" />
      <ToolbarButton
        icon={AlignBoxBottomLeftIcon}
        label="Page link"
        onClick={insertPageLink}
      />
      <ToolbarButton
        active={editor.isActive("link")}
        icon={Link01Icon}
        label="URL link"
        onClick={setLink}
      />
      <ToolbarButton icon={ImageAdd01Icon} label="Image" onClick={insertImage} />
      {editor.isActive("table") && (
        <>
          <div className="mx-1 h-5 w-px bg-line-soft dark:bg-line-soft-dark" />
          <ToolbarButton
            icon={TableIcon}
            label="Add row"
            onClick={() => editor.chain().focus().addRowAfter().run()}
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
