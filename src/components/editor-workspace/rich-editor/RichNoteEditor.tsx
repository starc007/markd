import { EditorContent, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NoteRecord } from "@/lib/types";
import { BacklinksPanel } from "./BacklinksPanel";
import { createEditorExtensions } from "./editorExtensions";
import { htmlToMarkdown, markdownToHtml } from "./markdown";
import { PageLinkPicker, type PagePickerState } from "./PageLinkPicker";
import { SelectionBubbleMenu } from "./SelectionBubbleMenu";
import {
  SlashCommandMenu,
  type SlashMenuState,
} from "./SlashCommandMenu";

export function RichNoteEditor({
  activeNoteId,
  content,
  notes,
  title,
  onChange,
  onCreatePage,
  onOpenPage,
  onSave,
}: {
  activeNoteId: string;
  content: string;
  notes: NoteRecord[];
  title: string;
  onChange: (content: string) => void;
  onCreatePage: (title: string) => Promise<unknown>;
  onOpenPage: (id: string) => Promise<void>;
  onSave: () => void;
}) {
  const externalContent = useRef(content);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [pagePicker, setPagePicker] = useState<PagePickerState | null>(null);
  const extensions = useMemo(() => createEditorExtensions(), []);
  const characters = content.length;
  const words = content.trim().length
    ? content.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const updateSlashMenu = useCallback((editor: NonNullable<ReturnType<typeof useEditor>>) => {
    const { selection } = editor.state;
    if (!selection.empty) {
      setSlashMenu(null);
      return;
    }

    const position = selection.from;
    const resolvedPosition = editor.state.doc.resolve(position);
    const textBefore = resolvedPosition.parent.textBetween(
      0,
      resolvedPosition.parentOffset,
      undefined,
      "\ufffc",
    );
    const match = /(?:^|\s)\/([a-z0-9 ]*)$/i.exec(textBefore);

    if (!match) {
      setSlashMenu(null);
      return;
    }

    const slashIndex = textBefore.lastIndexOf("/");
    const from = position - (textBefore.length - slashIndex);
    const coords = editor.view.coordsAtPos(position);
    const menuWidth = 248;
    const menuHeight = 264;
    const hasRoomBelow = window.innerHeight - coords.bottom > menuHeight + 18;
    const hasRoomAbove = coords.top > menuHeight + 18;

    setSlashMenu({
      query: match[1] ?? "",
      range: { from, to: position },
      position: {
        left: Math.max(12, Math.min(coords.left, window.innerWidth - menuWidth - 12)),
        top:
          hasRoomBelow || !hasRoomAbove
            ? coords.bottom + 8
            : Math.max(12, coords.top - menuHeight - 8),
      },
      side: hasRoomBelow || !hasRoomAbove ? "bottom" : "top",
    });
  }, []);

  const editor = useEditor({
    content: markdownToHtml(content),
    editorProps: {
      attributes: {
        class:
          "min-h-[calc(100vh-104px)] w-full max-w-none px-[clamp(36px,9vw,128px)] py-8 text-[17px] leading-[1.72] text-ink caret-ink outline-none selection:bg-selection selection:text-ink dark:text-ink-dark dark:caret-ink-dark dark:selection:bg-selection-dark dark:selection:text-ink-dark [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] dark:[&_.is-editor-empty:first-child::before]:text-muted-dark [&_a]:text-ink [&_a]:underline [&_a]:decoration-line [&_a]:underline-offset-4 dark:[&_a]:text-ink-dark [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:text-muted dark:[&_blockquote]:border-line-dark dark:[&_blockquote]:text-muted-dark [&_code]:rounded-md [&_code]:bg-hover [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.92em] dark:[&_code]:bg-hover-dark [&_h1]:mb-4 [&_h1]:mt-2 [&_h1]:text-[34px] [&_h1]:font-semibold [&_h1]:leading-tight [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-[25px] [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-[20px] [&_h3]:font-semibold [&_hr]:my-8 [&_hr]:border-line-soft dark:[&_hr]:border-line-soft-dark [&_img]:my-5 [&_img]:max-w-full [&_img]:rounded-2xl [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-panel-soft [&_pre]:p-4 dark:[&_pre]:bg-panel-soft-dark [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-line-soft [&_td]:p-2 dark:[&_td]:border-line-soft-dark [&_th]:border [&_th]:border-line-soft [&_th]:bg-panel-soft [&_th]:p-2 [&_th]:text-left dark:[&_th]:border-line-soft-dark dark:[&_th]:bg-panel-soft-dark [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul[data-type='taskList']]:my-2 [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0 [&_ul[data-type='taskList']_li]:my-0 [&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:items-start [&_ul[data-type='taskList']_li]:gap-2 [&_ul[data-type='taskList']_li>div]:min-w-0 [&_ul[data-type='taskList']_li>div]:flex-1 [&_ul[data-type='taskList']_li>div]:caret-ink dark:[&_ul[data-type='taskList']_li>div]:caret-ink-dark [&_ul[data-type='taskList']_li[data-checked='true']_div]:text-muted [&_ul[data-type='taskList']_li[data-checked='true']_div]:line-through [&_ul[data-type='taskList']_li[data-checked='true']_div]:decoration-line dark:[&_ul[data-type='taskList']_li[data-checked='true']_div]:text-muted-dark [&_ul[data-type='taskList']_label]:relative [&_ul[data-type='taskList']_label]:mt-[5px] [&_ul[data-type='taskList']_label]:grid [&_ul[data-type='taskList']_label]:h-5 [&_ul[data-type='taskList']_label]:w-5 [&_ul[data-type='taskList']_label]:shrink-0 [&_ul[data-type='taskList']_input]:absolute [&_ul[data-type='taskList']_input]:inset-0 [&_ul[data-type='taskList']_input]:h-5 [&_ul[data-type='taskList']_input]:w-5 [&_ul[data-type='taskList']_input]:cursor-pointer [&_ul[data-type='taskList']_input]:opacity-0 [&_ul[data-type='taskList']_label_span]:pointer-events-none [&_ul[data-type='taskList']_label_span]:relative [&_ul[data-type='taskList']_label_span]:block [&_ul[data-type='taskList']_label_span]:h-4 [&_ul[data-type='taskList']_label_span]:w-4 [&_ul[data-type='taskList']_label_span]:rounded-[5px] [&_ul[data-type='taskList']_label_span]:border [&_ul[data-type='taskList']_label_span]:border-line [&_ul[data-type='taskList']_label_span]:bg-panel [&_ul[data-type='taskList']_label_span]:transition-colors [&_ul[data-type='taskList']_label_span]:after:absolute [&_ul[data-type='taskList']_label_span]:after:left-[5px] [&_ul[data-type='taskList']_label_span]:after:top-[2px] [&_ul[data-type='taskList']_label_span]:after:h-2 [&_ul[data-type='taskList']_label_span]:after:w-1 [&_ul[data-type='taskList']_label_span]:after:rotate-45 [&_ul[data-type='taskList']_label_span]:after:border-b-2 [&_ul[data-type='taskList']_label_span]:after:border-r-2 [&_ul[data-type='taskList']_label_span]:after:border-panel [&_ul[data-type='taskList']_label_span]:after:opacity-0 [&_ul[data-type='taskList']_label_span]:after:transition-opacity dark:[&_ul[data-type='taskList']_label_span]:border-line-dark dark:[&_ul[data-type='taskList']_label_span]:bg-panel-dark dark:[&_ul[data-type='taskList']_label_span]:after:border-panel-dark [&_ul[data-type='taskList']_input:checked+span]:border-ink [&_ul[data-type='taskList']_input:checked+span]:bg-ink [&_ul[data-type='taskList']_input:checked+span]:after:opacity-100 dark:[&_ul[data-type='taskList']_input:checked+span]:border-ink-dark dark:[&_ul[data-type='taskList']_input:checked+span]:bg-ink-dark [&_ul[data-type='taskList']_input:focus-visible+span]:ring-2 [&_ul[data-type='taskList']_input:focus-visible+span]:ring-focus-line dark:[&_ul[data-type='taskList']_input:focus-visible+span]:ring-focus-line-dark [&_ul[data-type='taskList']_p]:my-0 [&_ul[data-type='taskList']_p]:min-h-[1.5em] [&_ul[data-type='taskList']_p]:leading-[1.5]",
      },
      handleClick(view, position) {
        const resolved = view.state.doc.resolve(position);
        const text = resolved.parent.textBetween(0, resolved.parent.content.size);
        const offset = resolved.parentOffset;

        for (const match of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
          const start = match.index ?? 0;
          const end = start + match[0].length;
          if (offset >= start && offset <= end) {
            const title = match[1].trim();
            const note = notes.find(
              (item) => item.title.toLowerCase() === title.toLowerCase(),
            );
            if (note) {
              onOpenPage(note.id);
            }
            return true;
          }
        }

        return false;
      },
    },
    extensions,
    immediatelyRender: false,
    onBlur: onSave,
    onUpdate: ({ editor }) => {
      const markdown = htmlToMarkdown(editor.getHTML());
      externalContent.current = markdown;
      onChange(markdown);
      updateSlashMenu(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      updateSlashMenu(editor);
    },
  });

  const openPagePicker = useCallback(() => {
    if (!editor) return;

    const coords = editor.view.coordsAtPos(editor.state.selection.to);
    const menuWidth = 248;
    const menuHeight = 248;
    const hasRoomBelow = window.innerHeight - coords.bottom > menuHeight + 18;
    const hasRoomAbove = coords.top > menuHeight + 18;

    setPagePicker({
      position: {
        left: Math.max(12, Math.min(coords.left, window.innerWidth - menuWidth - 12)),
        top:
          hasRoomBelow || !hasRoomAbove
            ? coords.bottom + 8
            : Math.max(12, coords.top - menuHeight - 8),
      },
      side: hasRoomBelow || !hasRoomAbove ? "bottom" : "top",
    });
  }, [editor]);

  useEffect(() => {
    if (!editor || content === externalContent.current) return;
    externalContent.current = content;
    editor.commands.setContent(markdownToHtml(content), {
      emitUpdate: false,
    });
  }, [content, editor]);

  return (
    <main className="relative flex h-full min-h-0 overflow-hidden bg-editor dark:bg-editor-dark">
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SelectionBubbleMenu
          editor={editor}
          notes={notes}
          onRequestPageLink={openPagePicker}
        />
        <EditorContent editor={editor} />
      </div>

      <SlashCommandMenu
        editor={editor}
        menu={slashMenu}
        onCreatePage={onCreatePage}
        onRequestPageLink={openPagePicker}
        onClose={() => setSlashMenu(null)}
      />

      <PageLinkPicker
        notes={notes}
        picker={pagePicker}
        onClose={() => setPagePicker(null)}
        onSelect={async (pageTitle) => {
          const title = pageTitle.trim();
          if (!title || !editor) return;
          if (!notes.some((note) => note.title.toLowerCase() === title.toLowerCase())) {
            await onCreatePage(title);
          }
          editor.chain().focus().insertContent(`[[${title}]]`).run();
          setPagePicker(null);
        }}
      />

      <BacklinksPanel
        activeNoteId={activeNoteId}
        activeTitle={title}
        content={content}
        notes={notes}
      />

      <div className="fixed bottom-4 right-4 rounded-full border border-line bg-panel/85 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-[22px] dark:border-line-dark dark:bg-panel-dark/85 dark:text-muted-dark">
        {characters.toLocaleString()} chars · {words.toLocaleString()} words
      </div>
    </main>
  );
}
