import { Trash2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MorphingModal } from "@/components/motion/morphing-modal";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/motion/tabs";
import { isValidPropertyKey, type Property } from "@/lib/frontmatter";

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
    <MorphingModal
      viewId={editingKey ? "edit-property" : "add-property"}
      onClose={onClose}
      placement="top"
      ariaLabel={editingKey ? "Edit property" : "Add property"}
      className="max-w-[410px] rounded-xl"
    >
      <header className="flex items-start gap-4 pb-2">
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold tracking-[-0.018em]">
            {editingKey ? "Edit property" : "Add property"}
          </h2>
          <p className="mt-1 text-[12px] leading-5 text-faint">
            Saved as YAML frontmatter in this note
          </p>
        </div>
        <button
          type="button"
          aria-label="Close property editor"
          onClick={onClose}
          className="ml-auto -mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-faint transition-colors hover:bg-hover hover:text-ink"
        >
          <X size={15} strokeWidth={2} />
        </button>
      </header>

      <form
        className="pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
            Name
          </span>
          <Input
            ref={nameRef}
            data-autofocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="status"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
            className="mt-2 text-[13px]"
          />
        </label>
        {(invalidName || duplicate) && (
          <p className="mt-1.5 text-[11.5px] text-danger">
            {duplicate
              ? "A property with this name already exists."
              : "Use letters, numbers, spaces, hyphens, or underscores."}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
            Type
          </span>
          <Tabs
            value={valueType}
            onValueChange={(type) => setValueType(type as ValueType)}
            variant="segment"
            className="inline-block"
          >
            <TabsList className="bg-panel p-1">
              <TabsTrigger value="text" className="min-w-16 py-1.5 text-[12px]">
                Text
              </TabsTrigger>
              <TabsTrigger value="list" className="min-w-16 py-1.5 text-[12px]">
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-5">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
              Value
            </span>
            {valueType === "text" ? (
              <Input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="active"
                className="mt-2 text-[13px]"
              />
            ) : (
              <textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={"one item per line\nsecond item"}
                rows={3}
                className="mt-2 w-full resize-none rounded-lg border border-line bg-panel px-3 py-2 text-[13px] leading-6 text-ink outline-none transition-colors placeholder:text-faint focus:border-faint"
              />
            )}
          </label>
          {valueType === "list" &&
            value.length > 0 &&
            listValues.length === 0 && (
              <p className="mt-1.5 text-[11.5px] text-danger">
                Add at least one list item.
              </p>
            )}
        </div>

        <div className="mt-7 flex items-center gap-2">
          {editingKey && (
            <Button
              variant="danger"
              size="sm"
              className="gap-1"
              onClick={() => {
                onDelete(editingKey);
                onClose();
              }}
            >
              <span className="inline-flex items-center gap-1.5 leading-4">
                <Trash2
                  size={13}
                  strokeWidth={1.8}
                  className="relative -top-px block shrink-0"
                />
                <span className="block leading-4">Delete</span>
              </span>
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
    </MorphingModal>
  );
}
