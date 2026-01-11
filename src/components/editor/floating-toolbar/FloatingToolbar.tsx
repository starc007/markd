import React, { useState, useRef, useEffect } from "react";
import { Editor } from "@tiptap/react";
import { offset, flip, shift, size } from "@floating-ui/react";
import { FloatingElement } from "../../tiptap-ui-utils/floating-element/floating-element";
import { useFloatingToolbarVisibility } from "../../../hooks/tiptap/use-floating-toolbar-visibility";
import { isSelectionValid } from "../../../lib/tiptap-collab-utils";
import { BoldIcon } from "../../tiptap-icons/bold-icon";
import { ItalicIcon } from "../../tiptap-icons/italic-icon";
import { UnderlineIcon } from "../../tiptap-icons/underline-icon";
import { StrikeIcon } from "../../tiptap-icons/strike-icon";
import { LinkIcon } from "../../tiptap-icons/link-icon";
import { cn } from "../../../lib/utils";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";

interface FloatingToolbarProps {
  editor: Editor | null;
}

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const [isLinkMenuOpen, setIsLinkMenuOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkButtonRef = useRef<HTMLButtonElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const linkMenuRef = useRef<HTMLDivElement>(null);
  const { shouldShow } = useFloatingToolbarVisibility({
    editor,
    isSelectionValid: (editor, selection) =>
      isSelectionValid(editor, selection),
  });

  if (!editor) {
    return null;
  }

  const handleLinkClick = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkUrl(previousUrl);
    setIsLinkMenuOpen(true);
  };

  // Focus input when menu opens
  useEffect(() => {
    if (isLinkMenuOpen && linkInputRef.current) {
      setTimeout(() => {
        linkInputRef.current?.focus();
        linkInputRef.current?.select();
      }, 100);
    }
  }, [isLinkMenuOpen]);

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = linkUrl.trim();

    if (trimmedUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      // Normalize URL: add https:// if missing
      let normalizedUrl = trimmedUrl;
      if (!normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: normalizedUrl })
        .run();
    }
    setIsLinkMenuOpen(false);
  };

  const handleRemoveLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setIsLinkMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsLinkMenuOpen(false);
    }
  };

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
          onClick={handleLinkClick}
          isActive={editor.isActive("link")}
          ariaLabel="Link"
          ref={linkButtonRef}
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Floating Link Input Menu */}
      <FloatingElement
        editor={editor}
        shouldShow={isLinkMenuOpen}
        referenceElement={linkButtonRef.current}
        zIndex={60}
        floatingOptions={{
          placement: "bottom-start",
          middleware: [
            offset(6),
            flip({
              fallbackPlacements: ["top-start", "bottom-end", "top-end"],
            }),
            shift({
              padding: 16,
            }),
            size({
              apply({ availableWidth, elements }) {
                // Constrain width to prevent overflow
                const maxWidth = Math.min(350, availableWidth - 32);
                elements.floating.style.maxWidth = `${maxWidth}px`;
                elements.floating.style.width = "max-content";
              },
            }),
          ],
        }}
        onOpenChange={setIsLinkMenuOpen}
      >
        <div
          ref={linkMenuRef}
          className="bg-background border border-border rounded-lg shadow-lg p-3 w-[300px] max-w-[calc(100vw-32px)]"
          onKeyDown={handleKeyDown}
        >
          <form onSubmit={handleLinkSubmit} className="space-y-2">
            <Input
              ref={linkInputRef}
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="text-sm"
            />
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="flex-1"
              >
                Apply
              </Button>
              {editor.isActive("link") && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleRemoveLink}
                >
                  Remove
                </Button>
              )}
            </div>
          </form>
        </div>
      </FloatingElement>
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

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ onClick, isActive, ariaLabel, children }, ref) => {
    return (
      <button
        ref={ref}
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
);

ToolbarButton.displayName = "ToolbarButton";
