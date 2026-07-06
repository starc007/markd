import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { tagColor } from "@/lib/tagColor";

function chipStyle(tag: string, active: boolean) {
  const color = tagColor(tag);
  return {
    color,
    backgroundColor: `color-mix(in srgb, ${color} ${active ? 26 : 14}%, transparent)`,
    borderColor: `color-mix(in srgb, ${color} ${active ? 55 : 28}%, transparent)`,
  };
}

/** Split raw input into clean tag tokens (drop leading #, lowercase). */
function parseTags(raw: string) {
  return raw
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, "").trim().toLowerCase())
    .filter(Boolean);
}

export function TagList({
  tags,
  onChange,
  onTagClick,
  activeTag,
  editable = true,
  removable = editable,
}: {
  tags: string[];
  onChange?: (tags: string[]) => void;
  onTagClick?: (tag: string) => void;
  activeTag?: string | null;
  /** show the free-text add affordance */
  editable?: boolean;
  /** show × to unassign a chip (defaults to `editable`) */
  removable?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const commit = (raw: string) => {
    const next = parseTags(raw).filter((t) => !tags.includes(t));
    if (next.length) onChange?.([...tags, ...next]);
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1"
      onClick={(event) => event.stopPropagation()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          style={chipStyle(tag, activeTag === tag)}
          className="group/tag inline-flex items-center gap-1 rounded-full border px-2 py-[1px] text-[11px] font-medium leading-none transition-colors"
        >
          <button
            type="button"
            className="max-w-[120px] truncate py-0.5"
            onClick={() => onTagClick?.(tag)}
          >
            #{tag}
          </button>
          {removable && (
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              className="grid place-items-center opacity-60 transition-opacity hover:opacity-100"
              onClick={() => onChange?.(tags.filter((t) => t !== tag))}
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          )}
        </span>
      ))}

      {editable &&
        (adding ? (
          <input
            ref={inputRef}
            placeholder="tag…"
            className="w-16 rounded-full border border-line bg-transparent px-2 py-0.5 text-[11px] leading-none text-ink outline-none"
            onBlur={(event) => {
              commit(event.target.value);
              event.currentTarget.value = "";
              setAdding(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                commit(event.currentTarget.value);
                event.currentTarget.value = "";
              } else if (event.key === "Escape") {
                setAdding(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            aria-label="Add tag"
            className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-line px-1.5 py-[3px] text-[11px] leading-none text-faint transition-colors hover:text-muted"
            onClick={() => setAdding(true)}
          >
            <Plus size={11} strokeWidth={2.5} />
            {tags.length === 0 && "tag"}
          </button>
        ))}
    </div>
  );
}
