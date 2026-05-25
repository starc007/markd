import {
  CheckListIcon,
  Delete02Icon,
  Link02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef } from "react";
import { cx } from "@/components/ui";
import type { StickyRecord } from "@/lib/types";
import { createStickyEditorExtensions } from "./rich-editor/editorExtensions";
import { htmlToMarkdown, markdownToHtml } from "./rich-editor/markdown";

export function StickyNoteCard({
  className,
  sticky,
  onDelete,
  onSave,
}: {
  className?: string;
  sticky: StickyRecord;
  onDelete: (id: string) => void;
  onSave: (
    sticky: Partial<StickyRecord> & Pick<StickyRecord, "content" | "color">,
  ) => void;
}) {
  const contentRef = useRef(sticky.content);
  const editor = useEditor({
    content: markdownToHtml(sticky.content),
    editorProps: {
      attributes: {
        class:
          "min-h-[164px] w-full rounded-2xl border border-line-soft px-3.5 pb-3.5 pt-11 text-sm leading-5 text-ink caret-ink outline-none transition-colors placeholder:text-muted focus:border-focus-line dark:border-line-soft-dark dark:text-ink-dark dark:caret-ink-dark dark:placeholder:text-muted-dark dark:focus:border-focus-line-dark [&_a]:text-ink [&_a]:underline [&_a]:decoration-line [&_a]:underline-offset-4 dark:[&_a]:text-ink-dark [&_em]:italic [&_p]:my-1 [&_strong]:font-semibold [&_ul]:my-1.5 [&_ul]:pl-5 [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0 [&_ul[data-type='taskList']_li]:my-1 [&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:items-start [&_ul[data-type='taskList']_li]:gap-2 [&_ul[data-type='taskList']_li>div]:min-w-0 [&_ul[data-type='taskList']_li>div]:flex-1 [&_ul[data-type='taskList']_li[data-checked='true']_div]:text-muted [&_ul[data-type='taskList']_li[data-checked='true']_div]:line-through dark:[&_ul[data-type='taskList']_li[data-checked='true']_div]:text-muted-dark [&_ul[data-type='taskList']_label]:relative [&_ul[data-type='taskList']_label]:mt-0.5 [&_ul[data-type='taskList']_label]:grid [&_ul[data-type='taskList']_label]:h-5 [&_ul[data-type='taskList']_label]:w-5 [&_ul[data-type='taskList']_label]:shrink-0 [&_ul[data-type='taskList']_input]:absolute [&_ul[data-type='taskList']_input]:inset-0 [&_ul[data-type='taskList']_input]:h-5 [&_ul[data-type='taskList']_input]:w-5 [&_ul[data-type='taskList']_input]:cursor-pointer [&_ul[data-type='taskList']_input]:opacity-0 [&_ul[data-type='taskList']_label_span]:pointer-events-none [&_ul[data-type='taskList']_label_span]:relative [&_ul[data-type='taskList']_label_span]:block [&_ul[data-type='taskList']_label_span]:h-4 [&_ul[data-type='taskList']_label_span]:w-4 [&_ul[data-type='taskList']_label_span]:rounded-[5px] [&_ul[data-type='taskList']_label_span]:border [&_ul[data-type='taskList']_label_span]:border-line [&_ul[data-type='taskList']_label_span]:bg-panel/70 dark:[&_ul[data-type='taskList']_label_span]:border-line-dark dark:[&_ul[data-type='taskList']_label_span]:bg-panel-dark/70 [&_ul[data-type='taskList']_label_span]:after:absolute [&_ul[data-type='taskList']_label_span]:after:left-[5px] [&_ul[data-type='taskList']_label_span]:after:top-[2px] [&_ul[data-type='taskList']_label_span]:after:h-2 [&_ul[data-type='taskList']_label_span]:after:w-1 [&_ul[data-type='taskList']_label_span]:after:rotate-45 [&_ul[data-type='taskList']_label_span]:after:border-b-2 [&_ul[data-type='taskList']_label_span]:after:border-r-2 [&_ul[data-type='taskList']_label_span]:after:border-panel [&_ul[data-type='taskList']_label_span]:after:opacity-0 dark:[&_ul[data-type='taskList']_label_span]:after:border-panel-dark [&_ul[data-type='taskList']_input:checked+span]:border-ink [&_ul[data-type='taskList']_input:checked+span]:bg-ink dark:[&_ul[data-type='taskList']_input:checked+span]:border-ink-dark dark:[&_ul[data-type='taskList']_input:checked+span]:bg-ink-dark [&_ul[data-type='taskList']_input:checked+span]:after:opacity-100 [&_ul[data-type='taskList']_p]:my-0",
      },
    },
    extensions: createStickyEditorExtensions(),
    immediatelyRender: false,
    onBlur: () => {
      onSave({ ...sticky, content: contentRef.current });
    },
    onUpdate: ({ editor }) => {
      contentRef.current = htmlToMarkdown(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || sticky.content === contentRef.current) return;
    contentRef.current = sticky.content;
    editor.commands.setContent(markdownToHtml(sticky.content), {
      emitUpdate: false,
    });
  }, [editor, sticky.content]);

  const saveNow = () => {
    if (!editor) return;
    contentRef.current = htmlToMarkdown(editor.getHTML());
    onSave({ ...sticky, content: contentRef.current });
  };

  return (
    <div className="group relative">
      <div className="absolute right-2 top-2 z-10 flex items-center rounded-xl bg-panel/70 p-0.5 opacity-0 backdrop-blur-[18px] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-panel-dark/70">
        <StickyToolButton
          label="Link"
          icon={Link02Icon}
          isActive={editor?.isActive("link")}
          onClick={() => {
            if (!editor) return;
            const existing = editor.getAttributes("link").href;
            const href = window.prompt("Link URL", existing || "https://");
            if (href === null) return;
            if (!href.trim()) {
              editor.chain().focus().unsetLink().run();
              saveNow();
              return;
            }
            editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
            saveNow();
          }}
        />
        <StickyToolButton
          label="Todo"
          icon={CheckListIcon}
          isActive={editor?.isActive("taskList")}
          onClick={() => {
            editor?.chain().focus().toggleTaskList().run();
            saveNow();
          }}
        />
        <StickyToolButton
          label="Delete sticky"
          icon={Delete02Icon}
          onClick={() => onDelete(sticky.id)}
        />
      </div>
      <div className={cx("rounded-2xl", className)}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function StickyToolButton({
  icon,
  isActive,
  label,
  onClick,
}: {
  icon: typeof Link02Icon;
  isActive?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cx(
        "grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-line dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark dark:focus-visible:ring-focus-line-dark",
        isActive && "bg-hover text-ink dark:bg-hover-dark dark:text-ink-dark",
      )}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      type="button"
    >
      <HugeiconsIcon icon={icon} size={14} color="currentColor" />
    </button>
  );
}
