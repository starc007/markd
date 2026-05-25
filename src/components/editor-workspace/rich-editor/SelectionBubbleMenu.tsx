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
  TextUnderlineIcon,
} from "@hugeicons/core-free-icons";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { NoteRecord } from "@/lib/types";
import { ToolbarButton } from "./ToolbarButton";

export function SelectionBubbleMenu({
  editor,
  onRequestPageLink,
}: {
  editor: Editor | null;
  notes: NoteRecord[];
  onRequestPageLink: () => void;
}) {
  if (!editor) return null;

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
        strategy: "fixed",
        placement: "top",
        offset: 8,
        flip: true,
        shift: { padding: 12 },
      }}
      appendTo={() => document.body}
      className="z-90 flex max-w-[min(420px,calc(100vw-24px))] flex-wrap items-center gap-0.5 rounded-2xl border border-line bg-panel/95 p-1 shadow-overlay backdrop-blur-[22px] dark:border-line-dark dark:bg-tooltip dark:text-tooltip-ink"
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
        onClick={onRequestPageLink}
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
