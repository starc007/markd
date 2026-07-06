import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Code,
  Italic,
  Link as LinkIcon,
  Strikethrough,
  Underline,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cx } from "@/lib/utils";

export function SelectionMenu({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (linkOpen) linkInputRef.current?.focus();
  }, [linkOpen]);

  const applyLink = () => {
    const url = linkInputRef.current?.value.trim();
    setLinkOpen(false);
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const href = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="selection-menu"
      shouldShow={({ state }) => !state.selection.empty}
      options={{ placement: "top", offset: 8 }}
    >
      <div className="flex items-center rounded-lg border border-line bg-bg p-0.5 shadow-lg shadow-black/8 dark:shadow-black/40">
        {linkOpen ? (
          <div className="flex items-center gap-1 px-1">
            <input
              ref={linkInputRef}
              defaultValue={editor.getAttributes("link").href ?? ""}
              placeholder="Paste a link…"
              className="h-7 w-[200px] bg-transparent px-1 text-[12.5px] text-ink outline-none placeholder:text-faint"
              onKeyDown={(event) => {
                if (event.key === "Enter") applyLink();
                if (event.key === "Escape") setLinkOpen(false);
              }}
              onBlur={() => setLinkOpen(false)}
            />
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[12px] font-medium text-ink hover:bg-hover"
              onMouseDown={(event) => {
                event.preventDefault();
                applyLink();
              }}
            >
              Set
            </button>
          </div>
        ) : (
          <>
            <MarkButton
              active={editor.isActive("bold")}
              label="Bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold size={14} strokeWidth={2} />
            </MarkButton>
            <MarkButton
              active={editor.isActive("italic")}
              label="Italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic size={14} strokeWidth={2} />
            </MarkButton>
            <MarkButton
              active={editor.isActive("underline")}
              label="Underline"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <Underline size={14} strokeWidth={2} />
            </MarkButton>
            <MarkButton
              active={editor.isActive("strike")}
              label="Strikethrough"
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough size={14} strokeWidth={2} />
            </MarkButton>
            <MarkButton
              active={editor.isActive("code")}
              label="Code"
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <Code size={14} strokeWidth={2} />
            </MarkButton>
            <div className="mx-0.5 h-4 w-px bg-line" />
            <MarkButton
              active={editor.isActive("link")}
              label="Link"
              onClick={() => setLinkOpen(true)}
            >
              <LinkIcon size={14} strokeWidth={2} />
            </MarkButton>
          </>
        )}
      </div>
    </BubbleMenu>
  );
}

function MarkButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label} side="top">
      <button
        type="button"
        className={cx(
          "grid h-7 w-7 place-items-center rounded-md transition-colors duration-75",
          active ? "bg-invert text-invert-ink" : "text-muted hover:bg-hover hover:text-ink",
        )}
        onMouseDown={(event) => {
          event.preventDefault();
          onClick();
        }}
      >
        {children}
      </button>
    </Tooltip>
  );
}
