import { Add01Icon, StickyNote01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
  onSave,
}: {
  stickies: StickyRecord[];
  onSave: (
    sticky: Partial<StickyRecord> & Pick<StickyRecord, "content" | "color">,
  ) => void;
}) {
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
            <textarea
              key={sticky.id}
              className={cx(
                "min-h-[164px] resize-y rounded-2xl border border-line p-3.5 text-sm leading-6 text-ink outline-none transition-colors placeholder:text-muted focus:border-focus-line dark:border-line-dark dark:text-ink-dark dark:placeholder:text-muted-dark dark:focus:border-focus-line-dark",
                stickyColors[sticky.color] ?? stickyColors.butter,
              )}
              defaultValue={sticky.content}
              onBlur={(event) => onSave({ ...sticky, content: event.target.value })}
            />
          ))}
          <button
            className="min-h-[164px] rounded-2xl border border-dashed border-line bg-panel-soft/60 p-3.5 text-left text-sm font-medium text-muted transition-colors hover:bg-hover dark:border-line-dark dark:bg-panel-soft-dark/60 dark:text-muted-dark dark:hover:bg-hover-dark"
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
