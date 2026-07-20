import { openUrl } from "@tauri-apps/plugin-opener";
import { Check, ExternalLink, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import type { PropertyType } from "@/lib/frontmatter";
import { cx } from "@/lib/utils";

function isWebUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function PropertyValueEditor({
  ref,
  type,
  value,
  name,
  onChange,
  onCommit,
}: {
  ref: (node: HTMLElement | null) => void;
  type: PropertyType;
  value: string;
  name: string;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
}) {
  const [editingUrl, setEditingUrl] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  if (type === "checkbox") {
    const checked = value === "true";
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => {
          const nextValue = String(!checked);
          onChange(nextValue);
          onCommit(nextValue);
        }}
        className="flex h-9 w-full items-center gap-2 rounded-md bg-transparent px-2 text-left text-[12.5px] text-muted outline-none transition-[color,box-shadow] duration-100 hover:text-ink focus-visible:ring-1 focus-visible:ring-line"
      >
        <span className="grid h-4 w-4 place-items-center rounded border border-line bg-panel">
          <Check
            size={11}
            strokeWidth={2.5}
            className={checked ? "opacity-100" : "opacity-0"}
          />
        </span>
        {checked ? "Checked" : "Unchecked"}
      </button>
    );
  }

  if (type === "list") {
    return (
      <textarea
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        aria-label={`${name || "Property"} list values`}
        placeholder="One item per line"
        rows={Math.min(3, Math.max(1, value.split(/\r?\n/).length))}
        className="min-h-9 w-full resize-none rounded-md bg-transparent px-2 py-2 text-[12.5px] leading-5 text-ink outline-none transition-shadow duration-100 placeholder:text-faint focus:ring-1 focus:ring-line"
      />
    );
  }

  if (type === "url" && isWebUrl(value) && !editingUrl) {
    return (
      <div className="group/url flex h-9 min-w-0 items-center">
        <button
          ref={ref}
          type="button"
          onClick={() => void openUrl(value)}
          className="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-md bg-transparent px-2 text-left text-[12.5px] text-ink outline-none transition-[color,box-shadow] duration-100 hover:text-muted focus-visible:ring-1 focus-visible:ring-line"
        >
          <span className="truncate underline decoration-line underline-offset-2">
            {value}
          </span>
          <ExternalLink size={12} strokeWidth={1.8} className="shrink-0" />
        </button>
        <Tooltip label="Edit URL" side="top">
          <button
            type="button"
            onClick={() => {
              setEditingUrl(true);
              requestAnimationFrame(() => {
                urlInputRef.current?.focus();
                urlInputRef.current?.select();
              });
            }}
            className="grid h-8 w-7 shrink-0 place-items-center rounded-md text-faint opacity-0 outline-none transition-[opacity,color,background-color] duration-100 hover:bg-active hover:text-ink group-hover/url:opacity-100 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-line"
          >
            <Pencil size={12} strokeWidth={1.8} />
          </button>
        </Tooltip>
      </div>
    );
  }

  const inputType =
    type === "number" ? "number" : type === "date" ? "date" : "text";
  const placeholder =
    type === "number"
      ? "0"
      : type === "date"
        ? "YYYY-MM-DD"
        : type === "url"
          ? "https://"
          : "Empty";

  return (
    <input
      ref={(node) => {
        if (type === "url") urlInputRef.current = node;
        ref(node);
      }}
      type={inputType}
      inputMode={type === "number" ? "decimal" : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onFocus={() => {
        if (type === "url") setEditingUrl(true);
      }}
      onBlur={() => {
        if (type === "url") setEditingUrl(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      aria-label={`${name || "Property"} value`}
      placeholder={placeholder}
      autoCapitalize="off"
      autoComplete="off"
      spellCheck={false}
      className={cx(
        "h-9 w-full rounded-md bg-transparent px-2 text-[12.5px] text-ink outline-none transition-shadow duration-100 placeholder:text-faint focus:ring-1 focus:ring-line",
        type === "number" &&
          "[appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none",
      )}
    />
  );
}
