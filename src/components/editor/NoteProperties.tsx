import { ChevronRight, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { EASE_OUT } from "@/lib/ease";
import type { Property } from "@/lib/frontmatter";
import { cx } from "@/lib/utils";
import { PropertyRow } from "./PropertyRow";

export function NoteProperties({
  properties,
  addRequest,
  onAddRequestHandled,
  onUpsert,
  onRemove,
}: {
  properties: Property[];
  addRequest: number;
  onAddRequestHandled: () => void;
  onUpsert: (previousKey: string | null, property: Property) => void;
  onRemove: (key: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addFocusNonce, setAddFocusNonce] = useState(0);

  const beginAdding = () => {
    setOpen(true);
    setAdding(true);
    setAddFocusNonce((value) => value + 1);
  };

  useEffect(() => {
    if (addRequest === 0) return;
    beginAdding();
    onAddRequestHandled();
  }, [addRequest, onAddRequestHandled]);

  if (properties.length === 0 && !adding) return null;

  return (
    <div className="mb-5 mt-1 border-b border-line pb-3">
      <div className="mb-1 flex items-center">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint transition-colors hover:text-muted"
        >
          <ChevronRight
            size={12}
            strokeWidth={2.5}
            className={cx(
              "transition-transform duration-150",
              open && "rotate-90",
            )}
          />
          Properties
          <span className="ml-0.5 font-mono text-[9.5px] font-normal tracking-normal">
            {properties.length}
          </span>
        </button>
        <Tooltip label="Add property" side="top">
          <button
            type="button"
            onClick={beginAdding}
            className="ml-auto grid h-6 w-6 place-items-center rounded-md text-faint transition-colors hover:bg-hover hover:text-ink active:scale-[0.96]"
          >
            <Plus size={13} strokeWidth={2} />
          </button>
        </Tooltip>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0, overflow: "hidden" }}
            animate={{
              height: "auto",
              opacity: 1,
              transitionEnd: { overflow: "visible" },
            }}
            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
            transition={{ duration: 0.16, ease: EASE_OUT }}
          >
            <div className="flex flex-col gap-0.5 pt-1">
              {properties.map((property) => (
                <PropertyRow
                  key={property.key}
                  property={property}
                  existingKeys={properties.map(({ key }) => key)}
                  onSave={onUpsert}
                  onRemove={onRemove}
                />
              ))}
              {adding && (
                <PropertyRow
                  key={`draft-${addFocusNonce}`}
                  existingKeys={properties.map(({ key }) => key)}
                  focusNonce={addFocusNonce}
                  onSave={(previousKey, property) => {
                    onUpsert(previousKey, property);
                    setAdding(false);
                  }}
                  onRemove={() => setAdding(false)}
                  onCancel={() => setAdding(false)}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
