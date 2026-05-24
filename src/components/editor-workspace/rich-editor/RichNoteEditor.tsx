import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useRef } from "react";
import type { NoteRecord } from "@/lib/types";
import { BacklinksPanel } from "./BacklinksPanel";
import { EditorToolbar } from "./EditorToolbar";
import { createEditorExtensions } from "./editorExtensions";
import { htmlToMarkdown, markdownToHtml } from "./markdown";

export function RichNoteEditor({
  activeNoteId,
  content,
  notes,
  title,
  onChange,
  onSave,
}: {
  activeNoteId: string;
  content: string;
  notes: NoteRecord[];
  title: string;
  onChange: (content: string) => void;
  onSave: () => void;
}) {
  const externalContent = useRef(content);
  const extensions = useMemo(() => createEditorExtensions(), []);
  const characters = content.length;
  const words = content.trim().length
    ? content.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const editor = useEditor({
    content: markdownToHtml(content),
    editorProps: {
      attributes: {
        class:
          "min-h-[calc(100vh-152px)] w-full max-w-none px-[clamp(36px,9vw,128px)] py-8 text-[17px] leading-[1.72] text-ink outline-none selection:bg-selection selection:text-ink dark:text-ink-dark dark:selection:bg-selection-dark dark:selection:text-ink-dark [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] dark:[&_.is-editor-empty:first-child::before]:text-muted-dark [&_a]:text-ink [&_a]:underline [&_a]:decoration-line [&_a]:underline-offset-4 dark:[&_a]:text-ink-dark [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:text-muted dark:[&_blockquote]:border-line-dark dark:[&_blockquote]:text-muted-dark [&_code]:rounded-md [&_code]:bg-hover [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.92em] dark:[&_code]:bg-hover-dark [&_h1]:mb-4 [&_h1]:mt-2 [&_h1]:text-[34px] [&_h1]:font-semibold [&_h1]:leading-tight [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-[25px] [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-[20px] [&_h3]:font-semibold [&_hr]:my-8 [&_hr]:border-line-soft dark:[&_hr]:border-line-soft-dark [&_img]:my-5 [&_img]:max-w-full [&_img]:rounded-2xl [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-panel-soft [&_pre]:p-4 dark:[&_pre]:bg-panel-soft-dark [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-line-soft [&_td]:p-2 dark:[&_td]:border-line-soft-dark [&_th]:border [&_th]:border-line-soft [&_th]:bg-panel-soft [&_th]:p-2 [&_th]:text-left dark:[&_th]:border-line-soft-dark dark:[&_th]:bg-panel-soft-dark [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0 [&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:gap-2 [&_ul[data-type='taskList']_label]:pt-1",
      },
    },
    extensions,
    immediatelyRender: false,
    onBlur: onSave,
    onUpdate: ({ editor }) => {
      const markdown = htmlToMarkdown(editor.getHTML());
      externalContent.current = markdown;
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (!editor || content === externalContent.current) return;
    externalContent.current = content;
    editor.commands.setContent(markdownToHtml(content), {
      emitUpdate: false,
    });
  }, [content, editor]);

  return (
    <main className="relative flex min-h-0 flex-1 overflow-hidden bg-editor dark:bg-editor-dark">
      <div className="min-w-0 flex-1 overflow-auto">
        <EditorToolbar editor={editor} notes={notes} />
        <EditorContent editor={editor} />
      </div>

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
