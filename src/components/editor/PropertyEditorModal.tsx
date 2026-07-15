import { ListPlus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { isValidPropertyKey, type Property } from "@/lib/frontmatter";
import { cx } from "@/lib/utils";

type ValueType = "text" | "list";

export function PropertyEditorModal({
  property,
  existingKeys,
  onClose,
  onSave,
  onDelete,
}: {
  property: Property | null;
  existingKeys: string[];
  onClose: () => void;
  onSave: (previousKey: string | null, property: Property) => void;
  onDelete: (key: string) => void;
}) {
  const editingKey = property?.key ?? null;
  const [name, setName] = useState(property?.key ?? "");
  const [valueType, setValueType] = useState<ValueType>(
    Array.isArray(property?.value) ? "list" : "text",
  );
  const [value, setValue] = useState(
    Array.isArray(property?.value)
      ? property.value.join("\n")
      : (property?.value ?? ""),
  );
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => nameRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  const cleanName = name.trim();
  const duplicate = useMemo(
    () =>
      existingKeys.some(
        (key) =>
          key !== editingKey &&
          key.toLocaleLowerCase() === cleanName.toLocaleLowerCase(),
      ),
    [cleanName, editingKey, existingKeys],
  );
  const listValues = value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const invalidName = cleanName.length > 0 && !isValidPropertyKey(cleanName);
  const canSave =
    cleanName.length > 0 &&
    !invalidName &&
    !duplicate &&
    (valueType === "text" || listValues.length > 0);

  const submit = () => {
    if (!canSave) return;
    onSave(editingKey, {
      key: cleanName,
      value: valueType === "list" ? listValues : value,
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      ariaLabel={editingKey ? "Edit property" : "Add property"}
      className="w-[430px]"
    >
      <header className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-invert text-invert-ink">
          <ListPlus size={15} strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
            {editingKey ? "Edit property" : "Add property"}
          </h2>
          <p className="mt-0.5 text-[11.5px] text-faint">
            Stored as YAML frontmatter in this note
          </p>
        </div>
        <button
          type="button"
          aria-label="Close property editor"
          onClick={onClose}
          className="ml-auto grid h-8 w-8 place-items-center rounded-md text-faint transition-colors hover:bg-hover hover:text-ink"
        >
          <X size={15} strokeWidth={2} />
        </button>
      </header>

      <form
        className="p-5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
            Name
          </span>
          <input
            ref={nameRef}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="status"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
            className="mt-2 h-9 w-full rounded-lg border border-line bg-panel px-3 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-faint"
          />
        </label>
        {(invalidName || duplicate) && (
          <p className="mt-1.5 text-[11.5px] text-danger">
            {duplicate
              ? "A property with this name already exists."
              : "Use letters, numbers, spaces, hyphens, or underscores."}
          </p>
        )}

        <div className="mt-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
            Type
          </span>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-panel p-1">
            {(["text", "list"] as const).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={valueType === type}
                onClick={() => setValueType(type)}
                className={cx(
                  "rounded-md py-1.5 text-[12px] font-medium capitalize transition-colors",
                  valueType === type
                    ? "bg-invert text-invert-ink"
                    : "text-muted hover:bg-hover hover:text-ink",
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
            Value
          </span>
          {valueType === "text" ? (
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="active"
              className="mt-2 h-9 w-full rounded-lg border border-line bg-panel px-3 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-faint"
            />
          ) : (
            <textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={"one item per line\nsecond item"}
              rows={4}
              className="mt-2 w-full resize-none rounded-lg border border-line bg-panel px-3 py-2 text-[13px] leading-6 text-ink outline-none transition-colors placeholder:text-faint focus:border-faint"
            />
          )}
        </label>
        {valueType === "list" && value.length > 0 && listValues.length === 0 && (
          <p className="mt-1.5 text-[11.5px] text-danger">
            Add at least one list item.
          </p>
        )}

        <div className="mt-6 flex items-center gap-2 border-t border-line-soft pt-4">
          {editingKey && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                onDelete(editingKey);
                onClose();
              }}
            >
              <Trash2 size={13} strokeWidth={1.8} />
              Delete
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!canSave}>
              {editingKey ? "Save" : "Add property"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
