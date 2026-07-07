import { X } from "lucide-react";
import { motion } from "motion/react";
import { useId, useState } from "react";
import { SPRING_LAYOUT } from "@/lib/ease";
import { tagColor } from "@/lib/tagColor";
import { cx } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/** Left filter rail: "All" + registry tags, with a gliding active pill. */
export function TagRail({
  tags,
  activeTag,
  onSelect,
  onDelete,
  counts = {},
}: {
  tags: string[];
  activeTag: string | null;
  onSelect: (tag: string | null) => void;
  onDelete: (tag: string) => void;
  /** item count per tag — deleting a tag with items asks for confirmation */
  counts?: Record<string, number>;
}) {
  const pillId = useId();
  const [confirmTag, setConfirmTag] = useState<string | null>(null);

  const requestDelete = (tag: string) => {
    if (counts[tag] > 0) {
      setConfirmTag(tag);
    } else {
      onDelete(tag);
    }
  };

  const confirmCount = confirmTag ? (counts[confirmTag] ?? 0) : 0;

  return (
    <aside className="sticky top-0 hidden w-[152px] shrink-0 sm:block">
      <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
        Tags
      </p>
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cx(
            "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
            activeTag === null
              ? "text-ink"
              : "text-muted hover:bg-hover hover:text-ink",
          )}
        >
          {activeTag === null && (
            <motion.span
              layoutId={pillId}
              transition={SPRING_LAYOUT}
              className="absolute inset-0 rounded-md bg-active"
            />
          )}
          <span className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full border border-faint" />
          <span className="relative z-10 truncate">All</span>
        </button>

        {tags.map((tag) => {
          const active = activeTag === tag;
          return (
            <div key={tag} className="group/rail flex items-center">
              <button
                type="button"
                onClick={() => onSelect(active ? null : tag)}
                className={cx(
                  "relative flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
                  active ? "text-ink" : "text-muted hover:bg-hover hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId={pillId}
                    transition={SPRING_LAYOUT}
                    className="absolute inset-0 rounded-md bg-active"
                  />
                )}
                <span
                  className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tagColor(tag) }}
                />
                <span className="relative z-10 truncate">{tag}</span>
              </button>
              <button
                type="button"
                aria-label={`Delete tag ${tag}`}
                onClick={() => requestDelete(tag)}
                className="grid h-6 w-6 shrink-0 place-items-center rounded text-faint opacity-0 transition-opacity hover:text-danger group-hover/rail:opacity-100"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>

      {tags.length === 0 && (
        <p className="mt-1 px-2 text-[12px] leading-relaxed text-faint">
          Create a tag from the top bar to start filtering.
        </p>
      )}

      <Modal open={confirmTag !== null} onClose={() => setConfirmTag(null)}>
        <div className="w-[320px] p-5">
          <h2 className="text-[14px] font-semibold text-ink">
            Delete #{confirmTag}?
          </h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
            {confirmCount} item{confirmCount === 1 ? "" : "s"} tagged
            #{confirmTag} will be untagged. This can&apos;t be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmTag(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirmTag) onDelete(confirmTag);
                setConfirmTag(null);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </aside>
  );
}
