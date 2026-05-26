import { ImageAdd01Icon, Link01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Editor } from "@tiptap/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import * as api from "@/lib/workspace-api";
import { applyImageAsset, applyImageUrl, applyUrlLink } from "./linkCommands";

export interface UrlCommandState {
  mode: "link" | "image";
  position: { left: number; top: number };
  selection: { from: number; to: number };
  side: "top" | "bottom";
  value?: string;
}

export function UrlCommandPopover({
  editor,
  workspaceRoot,
  state,
  onClose,
}: {
  editor: Editor | null;
  workspaceRoot: string;
  state: UrlCommandState | null;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!state) return;
    setValue(state.value ?? "https://");
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [state]);

  if (!state) return null;

  const submit = () => {
    if (!editor) return;
    const { from, to } = state.selection;
    const didApply =
      state.mode === "link"
        ? applyUrlLink(editor, value, from, to)
        : applyImageUrl(editor, value, from, to);
    if (didApply) onClose();
  };

  const uploadImage = async () => {
    if (!editor || !workspaceRoot || state.mode !== "image") return;

    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "Images",
          extensions: ["png", "jpg", "jpeg", "gif", "webp", "avif", "svg"],
        },
      ],
    });
    if (!selected || Array.isArray(selected)) return;

    const relativePath = await api.importImageAsset(selected);
    const displaySrc = convertFileSrc(
      `${workspaceRoot.replace(/\/$/, "")}/${relativePath}`,
    );
    const didApply = applyImageAsset(
      editor,
      displaySrc,
      relativePath,
      state.selection.from,
      state.selection.to,
    );
    if (didApply) onClose();
  };

  return (
    <AnimatePresence>
      <button
        aria-label="Close URL editor"
        className="fixed inset-0 z-70 cursor-default bg-transparent"
        onClick={onClose}
        type="button"
      />
      <motion.form
        animate={{ scale: 1, y: 0 }}
        className="fixed z-90 flex w-[350px] items-center gap-2 rounded-2xl border border-line bg-panel/95 p-1.5 shadow-overlay backdrop-blur-[22px] dark:border-line-dark dark:bg-tooltip"
        exit={{ scale: 0.98, y: state.side === "bottom" ? -6 : 6 }}
        initial={{ scale: 0.98, y: state.side === "bottom" ? -6 : 6 }}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        style={{
          left: state.position.left,
          top: state.position.top,
          transformOrigin: state.side === "bottom" ? "top left" : "bottom left",
        }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-panel-soft text-ink dark:bg-tooltip-ink/10 dark:text-tooltip-ink">
          <HugeiconsIcon
            icon={state.mode === "link" ? Link01Icon : ImageAdd01Icon}
            size={16}
            color="currentColor"
          />
        </span>
        <input
          aria-label={state.mode === "link" ? "Link URL" : "Image URL"}
          className="h-8 min-w-0 flex-1 rounded-xl border-0 bg-transparent px-1 text-sm text-ink outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-focus-line/50 dark:text-tooltip-ink dark:placeholder:text-tooltip-ink/55 dark:focus-visible:ring-focus-line-dark/50"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
            }
          }}
          placeholder="https://"
          ref={inputRef}
          type="url"
          value={value}
        />
        {state.mode === "image" && (
          <button
            className="h-8 rounded-xl px-3 text-xs font-medium text-muted transition-colors duration-150 hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-line dark:text-tooltip-ink/65 dark:hover:bg-tooltip-ink/10 dark:hover:text-tooltip-ink dark:focus-visible:ring-focus-line-dark"
            onClick={uploadImage}
            type="button"
          >
            Upload
          </button>
        )}
        <button
          className="h-8 rounded-xl bg-ink px-3 text-xs font-medium text-panel transition-transform duration-150 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-line dark:bg-tooltip-ink dark:text-tooltip"
          type="submit"
        >
          Add
        </button>
      </motion.form>
    </AnimatePresence>
  );
}
