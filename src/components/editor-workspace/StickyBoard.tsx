import { StickyNote01Icon } from "@hugeicons/core-free-icons";
import { cx } from "@/components/ui";
import type { StickyRecord } from "@/lib/types";
import { Board } from "./Board";

const stickyColors: Record<string, string> = {
  mint: "bg-sticky-mint",
  rose: "bg-sticky-rose",
  butter: "bg-sticky-butter",
  sky: "bg-sticky-sky",
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
              "min-h-[180px] resize-y rounded-[22px] border border-line p-4 text-ink outline-none transition-colors focus:border-focus-line",
              stickyColors[sticky.color] ?? stickyColors.butter,
            )}
            defaultValue={sticky.content}
            onBlur={(event) => onSave({ ...sticky, content: event.target.value })}
          />
        ))}
        <button
          className="min-h-[180px] rounded-[22px] border border-dashed border-line bg-transparent p-4 text-left text-sm text-muted transition-colors hover:bg-hover"
          onClick={() => onSave({ content: "New thought", color: "rose" })}
        >
          Add sticky
        </button>
      </div>
    </Board>
  );
}
