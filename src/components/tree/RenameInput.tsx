import { useEffect, useRef } from "react";
import type { TreeNode } from "@/lib/types";
import { useVault } from "@/stores/vault";

export function RenameInput({
  node,
  onDone,
}: {
  node: TreeNode;
  onDone: () => void;
}) {
  const renameEntry = useVault((state) => state.renameEntry);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submit = () => {
    if (submitted.current) return;
    submitted.current = true;
    const value = inputRef.current?.value.trim();
    onDone();
    if (value && value !== node.name) void renameEntry(node.rel, value);
  };

  return (
    <input
      ref={inputRef}
      defaultValue={node.name}
      className="w-full min-w-0 rounded-sm bg-bg px-1 text-[13px] text-ink outline-none ring-1 ring-line"
      onClick={(event) => event.stopPropagation()}
      onBlur={submit}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") submit();
        if (event.key === "Escape") {
          submitted.current = true;
          onDone();
        }
      }}
    />
  );
}
