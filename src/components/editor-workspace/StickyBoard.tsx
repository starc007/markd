import { StickyNote01Icon } from "@hugeicons/core-free-icons";
import { cx } from "@/components/ui";
import type { StickyRecord } from "@/lib/types";
import { Board } from "./Board";

const stickyColors: Record<string, string> = {
  mint: "bg-[#e4f3e8] dark:bg-[#22362b]",
  rose: "bg-[#f8e4e4] dark:bg-[#3a2828]",
  butter: "bg-[#f7f4dc] dark:bg-[#393621]",
  sky: "bg-[#e1edf7] dark:bg-[#223140]",
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
              "min-h-[180px] resize-y rounded-[22px] border border-[#dedbd3] p-4 text-[#191817] outline-none transition-colors focus:border-[#b9b5ac] dark:border-[#34322e] dark:text-[#f4f1ea] dark:focus:border-[#565148]",
              stickyColors[sticky.color] ?? stickyColors.butter,
            )}
            defaultValue={sticky.content}
            onBlur={(event) => onSave({ ...sticky, content: event.target.value })}
          />
        ))}
        <button
          className="min-h-[180px] rounded-[22px] border border-dashed border-[#dedbd3] bg-transparent p-4 text-left text-sm text-[#6f6b64] transition-colors hover:bg-[#e9eee6] dark:border-[#34322e] dark:text-[#aaa39a] dark:hover:bg-[#2a3029]"
          onClick={() => onSave({ content: "New thought", color: "rose" })}
        >
          Add sticky
        </button>
      </div>
    </Board>
  );
}
