import { Editor } from "@tiptap/react";
import { offset } from "@floating-ui/react";
import { FloatingElement } from "../../tiptap-ui-utils/floating-element/floating-element";
import { useFloatingToolbarVisibility } from "../../../hooks/tiptap/use-floating-toolbar-visibility";
import { isSelectionValid } from "../../../lib/tiptap-collab-utils";
import { BoldIcon } from "../../tiptap-icons/bold-icon";
import { ItalicIcon } from "../../tiptap-icons/italic-icon";
import { UnderlineIcon } from "../../tiptap-icons/underline-icon";
import { StrikeIcon } from "../../tiptap-icons/strike-icon";
import { LinkIcon } from "../../tiptap-icons/link-icon";
import { cn } from "../../../lib/utils";

interface FloatingToolbarProps {
  editor: Editor | null;
}

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const { shouldShow } = useFloatingToolbarVisibility({
    editor,
    isSelectionValid: (editor, selection) =>
      isSelectionValid(editor, selection),
  });

  if (!editor) {
    return null;
  }

  return (
    <FloatingElement
      editor={editor}
      shouldShow={shouldShow}
      zIndex={50}
      floatingOptions={{
        placement: "top",
        middleware: [offset(8)],
      }}
    >
      <div className="flex items-center gap-1 bg-background border border-border rounded-lg shadow-lg p-1">
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          ariaLabel="Bold"
        >
          <BoldIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          ariaLabel="Italic"
        >
          <ItalicIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          ariaLabel="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          ariaLabel="Strikethrough"
        >
          <StrikeIcon className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          editor={editor}
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href;
            const url = window.prompt("Enter URL:", previousUrl || "");
            if (url === null) {
              return;
            }
            if (url === "") {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
            } else {
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: url })
                .run();
            }
          }}
          isActive={editor.isActive("link")}
          ariaLabel="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
      </div>
    </FloatingElement>
  );
}

interface ToolbarButtonProps {
  editor: Editor;
  onClick: () => void;
  isActive: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive,
  ariaLabel,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "p-2 rounded transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}
