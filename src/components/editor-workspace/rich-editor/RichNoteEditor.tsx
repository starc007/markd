import { EditorContent, useEditor } from "@tiptap/react";
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NoteRecord } from "@/lib/types";
import { BacklinksPanel } from "./BacklinksPanel";
import { createEditorExtensions } from "./editorExtensions";
import { htmlToMarkdown, isLikelyMarkdown, markdownToHtml } from "./markdown";
import { PageLinkPicker, type PagePickerState } from "./PageLinkPicker";
import { SelectionBubbleMenu } from "./SelectionBubbleMenu";
import { SlashCommandMenu, type SlashMenuState } from "./SlashCommandMenu";
import { UrlCommandPopover, type UrlCommandState } from "./UrlCommandPopover";

export function RichNoteEditor({
  activeNoteId,
  content,
  notes,
  shouldSelectTitle,
  title,
  onChange,
  onCreatePage,
  onOpenPage,
  onSave,
  onTitleChange,
  onTitleSelected,
  onTitleSave,
}: {
  activeNoteId: string;
  content: string;
  notes: NoteRecord[];
  shouldSelectTitle: boolean;
  title: string;
  onChange: (content: string) => void;
  onCreatePage: (title: string) => Promise<unknown>;
  onOpenPage: (id: string) => Promise<void>;
  onSave: () => void;
  onTitleChange: (title: string) => void;
  onTitleSelected: () => void;
  onTitleSave: () => void;
}) {
  const externalContent = useRef(content);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [pagePicker, setPagePicker] = useState<PagePickerState | null>(null);
  const [urlCommand, setUrlCommand] = useState<UrlCommandState | null>(null);
  const extensions = useMemo(() => createEditorExtensions(), []);
  const characters = content.length;
  const words = content.trim().length
    ? content.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const updateSlashMenu = useCallback(
    (editor: NonNullable<ReturnType<typeof useEditor>>) => {
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
          left: Math.max(
            12,
            Math.min(coords.left, window.innerWidth - menuWidth - 12),
          ),
          top:
            hasRoomBelow || !hasRoomAbove
              ? coords.bottom + 8
              : Math.max(12, coords.top - menuHeight - 8),
        },
        side: hasRoomBelow || !hasRoomAbove ? "bottom" : "top",
      });
    },
    [],
  );

  const editor = useEditor({
    content: markdownToHtml(content),
    editorProps: {
      attributes: {
        class:
          "min-h-[calc(100vh-172px)] w-full max-w-none px-[clamp(36px,9vw,128px)] pb-8 pt-1 text-[17px] leading-[1.6] text-ink caret-ink outline-none selection:bg-selection selection:text-ink dark:text-ink-dark dark:caret-ink-dark dark:selection:bg-selection-dark dark:selection:text-ink-dark [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] dark:[&_.is-editor-empty:first-child::before]:text-muted-dark [&_a]:text-ink [&_a]:underline [&_a]:decoration-line [&_a]:underline-offset-4 dark:[&_a]:text-ink-dark [&_del]:text-muted [&_del]:decoration-line dark:[&_del]:text-muted-dark [&_em]:italic [&_s]:text-muted [&_s]:decoration-line dark:[&_s]:text-muted-dark [&_strong]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:text-muted dark:[&_blockquote]:border-line-dark dark:[&_blockquote]:text-muted-dark [&_code]:rounded-md [&_code]:bg-hover [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.92em] dark:[&_code]:bg-hover-dark [&_h1]:mb-4 [&_h1]:mt-2 [&_h1]:text-[34px] [&_h1]:font-semibold [&_h1]:leading-tight [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-[25px] [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-[20px] [&_h3]:font-semibold [&_hr]:my-8 [&_hr]:border-line-soft dark:[&_hr]:border-line-soft-dark [&_img]:my-5 [&_img]:max-w-full [&_img]:rounded-2xl [&_li]:my-0.5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-1.5 [&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-panel-soft [&_pre]:p-4 dark:[&_pre]:bg-panel-soft-dark [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-line-soft [&_td]:p-2 dark:[&_td]:border-line-soft-dark [&_th]:border [&_th]:border-line-soft [&_th]:bg-panel-soft [&_th]:p-2 [&_th]:text-left dark:[&_th]:border-line-soft-dark dark:[&_th]:bg-panel-soft-dark [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul[data-type='taskList']]:my-1.5 [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0 [&_ul[data-type='taskList']_li]:my-0 [&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:items-start [&_ul[data-type='taskList']_li]:gap-2 [&_ul[data-type='taskList']_li>div]:min-w-0 [&_ul[data-type='taskList']_li>div]:flex-1 [&_ul[data-type='taskList']_li>div]:caret-ink dark:[&_ul[data-type='taskList']_li>div]:caret-ink-dark [&_ul[data-type='taskList']_li[data-checked='true']_div]:text-muted [&_ul[data-type='taskList']_li[data-checked='true']_div]:line-through [&_ul[data-type='taskList']_li[data-checked='true']_div]:decoration-line dark:[&_ul[data-type='taskList']_li[data-checked='true']_div]:text-muted-dark [&_ul[data-type='taskList']_label]:relative [&_ul[data-type='taskList']_label]:mt-[4px] [&_ul[data-type='taskList']_label]:grid [&_ul[data-type='taskList']_label]:h-5 [&_ul[data-type='taskList']_label]:w-5 [&_ul[data-type='taskList']_label]:shrink-0 [&_ul[data-type='taskList']_input]:absolute [&_ul[data-type='taskList']_input]:inset-0 [&_ul[data-type='taskList']_input]:h-5 [&_ul[data-type='taskList']_input]:w-5 [&_ul[data-type='taskList']_input]:cursor-pointer [&_ul[data-type='taskList']_input]:opacity-0 [&_ul[data-type='taskList']_label_span]:pointer-events-none [&_ul[data-type='taskList']_label_span]:relative [&_ul[data-type='taskList']_label_span]:block [&_ul[data-type='taskList']_label_span]:h-[18px] [&_ul[data-type='taskList']_label_span]:w-[18px] [&_ul[data-type='taskList']_label_span]:rounded-md [&_ul[data-type='taskList']_label_span]:border [&_ul[data-type='taskList']_label_span]:border-line [&_ul[data-type='taskList']_label_span]:bg-panel [&_ul[data-type='taskList']_label_span]:transition-colors [&_ul[data-type='taskList']_label_span]:after:absolute [&_ul[data-type='taskList']_label_span]:after:left-[6px] [&_ul[data-type='taskList']_label_span]:after:top-[3px] [&_ul[data-type='taskList']_label_span]:after:h-2 [&_ul[data-type='taskList']_label_span]:after:w-1 [&_ul[data-type='taskList']_label_span]:after:rotate-45 [&_ul[data-type='taskList']_label_span]:after:border-b-2 [&_ul[data-type='taskList']_label_span]:after:border-r-2 [&_ul[data-type='taskList']_label_span]:after:border-panel [&_ul[data-type='taskList']_label_span]:after:opacity-0 [&_ul[data-type='taskList']_label_span]:after:transition-opacity dark:[&_ul[data-type='taskList']_label_span]:border-line-dark dark:[&_ul[data-type='taskList']_label_span]:bg-panel-dark dark:[&_ul[data-type='taskList']_label_span]:after:border-panel-dark [&_ul[data-type='taskList']_input:checked+span]:border-ink [&_ul[data-type='taskList']_input:checked+span]:bg-ink [&_ul[data-type='taskList']_input:checked+span]:after:opacity-100 dark:[&_ul[data-type='taskList']_input:checked+span]:border-ink-dark dark:[&_ul[data-type='taskList']_input:checked+span]:bg-ink-dark [&_ul[data-type='taskList']_input:focus-visible+span]:ring-2 [&_ul[data-type='taskList']_input:focus-visible+span]:ring-focus-line dark:[&_ul[data-type='taskList']_input:focus-visible+span]:ring-focus-line-dark [&_ul[data-type='taskList']_p]:my-0 [&_ul[data-type='taskList']_p]:min-h-[1.45em] [&_ul[data-type='taskList']_p]:leading-[1.45]",
      },
      handlePaste(view, event) {
        const markdown = event.clipboardData?.getData("text/plain");
        if (!markdown || !isLikelyMarkdown(markdown)) return false;

        event.preventDefault();
        const container = document.createElement("div");
        container.innerHTML = markdownToHtml(markdown);
        const slice = ProseMirrorDOMParser.fromSchema(
          view.state.schema,
        ).parseSlice(container);
        view.dispatch(view.state.tr.replaceSelection(slice).scrollIntoView());
        return true;
      },
      handleClick(view, position, event) {
        const resolved = view.state.doc.resolve(position);
        const text = resolved.parent.textBetween(
          0,
          resolved.parent.content.size,
        );
        const offset = resolved.parentOffset;
        const target = event.target as HTMLElement | null;
        const clickedWikiLink = target?.closest("[data-wiki-link]");

        for (const match of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
          const start = match.index ?? 0;
          const end = start + match[0].length;
          if (offset >= start && offset <= end) {
            const title = match[1].trim();
            if (clickedWikiLink) {
              const note = notes.find(
                (item) => item.title.toLowerCase() === title.toLowerCase(),
              );
              if (note) {
                onOpenPage(note.id);
              }
              return true;
            }

            const tokenEnd = resolved.start() + end;
            view.dispatch(
              view.state.tr.setSelection(
                TextSelection.create(view.state.doc, tokenEnd),
              ),
            );
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
      range: {
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      },
      position: {
        left: Math.max(
          12,
          Math.min(coords.left, window.innerWidth - menuWidth - 12),
        ),
        top:
          hasRoomBelow || !hasRoomAbove
            ? coords.bottom + 8
            : Math.max(12, coords.top - menuHeight - 8),
      },
      side: hasRoomBelow || !hasRoomAbove ? "bottom" : "top",
    });
  }, [editor]);

  const openUrlCommand = useCallback(
    (mode: UrlCommandState["mode"]) => {
      if (!editor) return;

      const { from, to } = editor.state.selection;
      const coords = editor.view.coordsAtPos(to);
      const menuWidth = 290;
      const menuHeight = 52;
      const hasRoomBelow = window.innerHeight - coords.bottom > menuHeight + 18;
      const hasRoomAbove = coords.top > menuHeight + 18;

      setUrlCommand({
        mode,
        selection: { from, to },
        value:
          mode === "link"
            ? (editor.getAttributes("link").href as string | undefined)
            : undefined,
        position: {
          left: Math.max(
            12,
            Math.min(coords.left, window.innerWidth - menuWidth - 12),
          ),
          top:
            hasRoomBelow || !hasRoomAbove
              ? coords.bottom + 8
              : Math.max(12, coords.top - menuHeight - 8),
        },
        side: hasRoomBelow || !hasRoomAbove ? "bottom" : "top",
      });
    },
    [editor],
  );

  useEffect(() => {
    if (!editor || content === externalContent.current) return;
    externalContent.current = content;
    editor.commands.setContent(markdownToHtml(content), {
      emitUpdate: false,
    });
  }, [content, editor]);

  useEffect(() => {
    if (!shouldSelectTitle) return;

    window.requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
      onTitleSelected();
    });
  }, [onTitleSelected, shouldSelectTitle]);

  return (
    <main className="relative flex h-full min-h-0 overflow-hidden bg-editor dark:bg-editor-dark">
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="px-[clamp(36px,9vw,128px)] pt-4">
          <input
            className="block w-full rounded-xl border-0 bg-transparent p-0 text-[40px] font-semibold leading-tight text-ink caret-ink outline-none placeholder:text-muted transition-colors focus-visible:ring-2 focus-visible:ring-focus-line/40 dark:text-ink-dark dark:caret-ink-dark dark:placeholder:text-muted-dark dark:focus-visible:ring-focus-line-dark/40"
            onBlur={onTitleSave}
            onChange={(event) => onTitleChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                editor?.commands.focus("start");
              }
            }}
            placeholder="Untitled"
            ref={titleInputRef}
            value={title}
          />
        </div>
        <SelectionBubbleMenu
          editor={editor}
          notes={notes}
          onRequestPageLink={openPagePicker}
          onRequestUrlImage={() => openUrlCommand("image")}
          onRequestUrlLink={() => openUrlCommand("link")}
        />
        <EditorContent editor={editor} />
      </div>

      <SlashCommandMenu
        editor={editor}
        menu={slashMenu}
        onCreatePage={onCreatePage}
        onRequestPageLink={openPagePicker}
        onRequestUrlImage={() => openUrlCommand("image")}
        onClose={() => setSlashMenu(null)}
      />

      <PageLinkPicker
        notes={notes}
        picker={pagePicker}
        onClose={() => setPagePicker(null)}
        onSelect={async (pageTitle) => {
          const title = pageTitle.trim();
          if (!title || !editor || !pagePicker) return;
          if (
            !notes.some(
              (note) => note.title.toLowerCase() === title.toLowerCase(),
            )
          ) {
            await onCreatePage(title);
          }
          editor
            .chain()
            .focus()
            .deleteRange(pagePicker.range)
            .insertContent(`[[${title}]]`)
            .setTextSelection(pagePicker.range.from + title.length + 4)
            .run();
          setPagePicker(null);
        }}
      />

      <UrlCommandPopover
        editor={editor}
        state={urlCommand}
        onClose={() => setUrlCommand(null)}
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
