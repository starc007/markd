import { ChevronRight, Pencil, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Property } from "@/lib/frontmatter";
import { EASE_OUT } from "@/lib/ease";
import { cx, hostOf } from "@/lib/utils";
import { PropertyEditorModal } from "./PropertyEditorModal";

type EditorState = { property: Property | null } | null;

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
  const [editor, setEditor] = useState<EditorState>(null);

  useEffect(() => {
    if (addRequest === 0) return;
    setOpen(true);
    setEditor({ property: null });
    onAddRequestHandled();
  }, [addRequest, onAddRequestHandled]);

  const propertyEditor = editor ? (
    <PropertyEditorModal
      key={editor.property?.key ?? "new"}
      property={editor.property}
      existingKeys={properties.map((property) => property.key)}
      onClose={() => setEditor(null)}
      onSave={onUpsert}
      onDelete={onRemove}
    />
  ) : null;

  if (properties.length === 0) return propertyEditor;

  return (
    <>
      <div className="mb-5 mt-1 border-b border-line pb-3">
        <div className="mb-1 flex items-center">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
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
          <button
            type="button"
            aria-label="Add property"
            title="Add property"
            onClick={() => {
              setOpen(true);
              setEditor({ property: null });
            }}
            className="ml-auto grid h-6 w-6 place-items-center rounded-md text-faint transition-colors hover:bg-hover hover:text-ink"
          >
            <Plus size={13} strokeWidth={2} />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.16, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-0.5 pt-1">
                {properties.map((property) => (
                  <div
                    key={property.key}
                    className="group flex items-center gap-3 rounded-md px-1 py-1 text-[12.5px] transition-colors hover:bg-hover"
                  >
                    <span className="w-24 shrink-0 truncate capitalize leading-5 text-faint">
                      {property.key}
                    </span>
                    <div className="flex min-h-5 min-w-0 flex-1 items-center">
                      <PropertyValue value={property.value} />
                    </div>
                    <button
                      type="button"
                      aria-label={`Edit ${property.key}`}
                      onClick={() => setEditor({ property })}
                      className="grid h-5 w-5 shrink-0 place-items-center rounded text-faint opacity-0 transition-[opacity,color,background-color] hover:bg-active hover:text-ink group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Pencil size={11} strokeWidth={1.9} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {propertyEditor}
    </>
  );
}

function PropertyValue({ value }: { value: string | string[] }) {
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, index) => (
          <span
            key={index}
            className="rounded-full bg-hover px-2 py-0.5 text-[11.5px] leading-4 text-muted"
          >
            {item}
          </span>
        ))}
      </div>
    );
  }
  if (/^https?:\/\//i.test(value)) {
    return (
      <a
        href={value}
        className="truncate text-ink underline decoration-line underline-offset-2 hover:decoration-ink"
        title={value}
      >
        {hostOf(value)}
      </a>
    );
  }
  return <span className="text-ink">{value}</span>;
}
