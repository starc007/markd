import { StickyNote01Icon } from "@hugeicons/core-free-icons";
import { cx } from "@/components/ui";
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
    <Board title="Sticky notes" icon={StickyNote01Icon}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {stickies.map((sticky) => (
          <textarea
            key={sticky.id}
            className={cx(
              "min-h-[180px] resize-y rounded-[22px] border border-line dark:border-line-dark p-4 text-ink dark:text-ink-dark outline-none transition-colors focus:border-focus-line dark:focus:border-focus-line-dark",
              stickyColors[sticky.color] ?? stickyColors.butter,
            )}
            defaultValue={sticky.content}
            onBlur={(event) => onSave({ ...sticky, content: event.target.value })}
          />
        ))}
        <button
          className="min-h-[180px] rounded-[22px] border border-dashed border-line bg-transparent p-4 text-left text-sm text-muted transition-colors hover:bg-hover dark:border-line-dark dark:text-muted-dark dark:hover:bg-hover-dark"
          onClick={() => onSave({ content: "New thought", color: "rose" })}
        >
          Add sticky
        </button>
      </div>
    </Board>
  );
}
