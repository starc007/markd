import {
  Add01Icon,
  CheckListIcon,
  Delete02Icon,
  Link02Icon,
  StickyNote01Icon,
  TextBoldIcon,
  TextItalicIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef } from "react";
import { Button, EmptyState, cx } from "@/components/ui";
import type { StickyRecord } from "@/lib/types";
import { Board } from "./Board";

const stickyColors: Record<string, string> = {
  mint: "bg-sticky-mint dark:bg-sticky-mint-dark",
  rose: "bg-sticky-rose dark:bg-sticky-rose-dark",
  butter: "bg-sticky-butter dark:bg-sticky-butter-dark",
  sky: "bg-sticky-sky dark:bg-sticky-sky-dark",
};

export function StickyBoard({
  stickies,
  onDelete,
  onSave,
}: {
  stickies: StickyRecord[];
  onDelete: (id: string) => void;
  onSave: (
    sticky: Partial<StickyRecord> & Pick<StickyRecord, "content" | "color">,
  ) => void;
}) {
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const insertMarkdown = (
    sticky: StickyRecord,
    before: string,
    after = "",
    fallback = "",
  ) => {
    const textarea = textareaRefs.current[sticky.id];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end) || fallback;
    const nextValue = `${textarea.value.slice(0, start)}${before}${selected}${after}${textarea.value.slice(end)}`;
    const nextCursor = start + before.length + selected.length + after.length;

    textarea.value = nextValue;
    textarea.focus();
    textarea.setSelectionRange(nextCursor, nextCursor);
    onSave({ ...sticky, content: nextValue });
  };

  return (
    <Board
      title="Sticky notes"
      icon={StickyNote01Icon}
      description="Small fragments and loose thoughts before they become structured notes."
      meta={
        <Button
          className="min-h-8 rounded-xl px-2.5 text-xs"
          onClick={() => onSave({ content: "New thought", color: "rose" })}
        >
          <HugeiconsIcon icon={Add01Icon} size={14} color="currentColor" />
          Add
        </Button>
      }
    >
      {stickies.length === 0 ? (
        <EmptyState
          icon={StickyNote01Icon}
          title="No sticky notes"
          description="Capture a quick thought here without deciding where it belongs yet."
          action={
            <Button onClick={() => onSave({ content: "New thought", color: "rose" })}>
              <HugeiconsIcon icon={Add01Icon} size={15} color="currentColor" />
              Add sticky
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
          {stickies.map((sticky) => (
            <div className="group relative" key={sticky.id}>
              <div className="absolute right-2 top-2 z-10 flex items-center rounded-xl bg-panel/65 p-0.5 opacity-0 backdrop-blur-[18px] transition-opacity group-hover:opacity-100 dark:bg-panel-dark/65">
                {[
                  {
                    label: "Bold",
                    icon: TextBoldIcon,
                    action: () => insertMarkdown(sticky, "**", "**", "bold"),
                  },
                  {
                    label: "Italic",
                    icon: TextItalicIcon,
                    action: () => insertMarkdown(sticky, "*", "*", "italic"),
                  },
                  {
                    label: "Link",
                    icon: Link02Icon,
                    action: () => insertMarkdown(sticky, "[", "](https://)", "link"),
                  },
                  {
                    label: "Todo",
                    icon: CheckListIcon,
                    action: () => insertMarkdown(sticky, "- [ ] ", "", "Task"),
                  },
                ].map((item) => (
                  <button
                    aria-label={item.label}
                    className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-ink dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark"
                    key={item.label}
                    onClick={item.action}
                    onMouseDown={(event) => event.preventDefault()}
                    type="button"
                  >
                    <HugeiconsIcon icon={item.icon} size={14} color="currentColor" />
                  </button>
                ))}
                <button
                  aria-label="Delete sticky"
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-ink dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark"
                  onClick={() => onDelete(sticky.id)}
                  onMouseDown={(event) => event.preventDefault()}
                  type="button"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={14} color="currentColor" />
                </button>
              </div>
              <textarea
                className={cx(
                  "min-h-[164px] w-full resize-y rounded-2xl border border-line-soft p-3.5 pt-11 text-sm leading-6 text-ink outline-none transition-colors placeholder:text-muted focus:border-focus-line dark:border-line-soft-dark dark:text-ink-dark dark:placeholder:text-muted-dark dark:focus:border-focus-line-dark",
                  stickyColors[sticky.color] ?? stickyColors.butter,
                )}
                defaultValue={sticky.content}
                onBlur={(event) => onSave({ ...sticky, content: event.target.value })}
                placeholder="Markdown: **bold**, *italic*, [link](https://), - [ ] todo"
                ref={(element) => {
                  textareaRefs.current[sticky.id] = element;
                }}
              />
            </div>
          ))}
          <button
            className="min-h-[164px] rounded-2xl border border-dashed border-line-soft bg-panel-soft/60 p-3.5 text-left text-sm font-medium text-muted transition-colors hover:bg-hover dark:border-line-soft-dark dark:bg-panel-soft-dark/60 dark:text-muted-dark dark:hover:bg-hover-dark"
            onClick={() => onSave({ content: "New thought", color: "rose" })}
          >
            <span className="inline-flex items-center gap-2">
              <HugeiconsIcon icon={Add01Icon} size={15} color="currentColor" />
              Add sticky
            </span>
          </button>
        </div>
      )}
    </Board>
  );
}
