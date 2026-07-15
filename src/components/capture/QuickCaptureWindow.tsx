import { emit, listen } from "@tauri-apps/api/event";
import { CornerDownLeft, Feather, X } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/Button";
import { ipc } from "@/lib/ipc";
import { EASE_OUT } from "@/lib/ease";
import { applyTheme } from "@/lib/theme";

const OPEN_EVENT = "markd:quick-capture-open";
const NOTES_CHANGED_EVENT = "markd:notes-changed";

export function QuickCaptureWindow() {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [openNonce, setOpenNonce] = useState(0);
  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const reset = useCallback(() => {
    setTitle("");
    setValue("");
    setSaving(false);
    setOpenNonce((nonce) => nonce + 1);
    requestAnimationFrame(() => titleRef.current?.focus());
  }, []);

  useEffect(() => {
    void ipc.getTheme().then(applyTheme);
    let unlisten: (() => void) | undefined;
    let disposed = false;
    void listen(OPEN_EVENT, reset).then((stop) => {
      if (disposed) stop();
      else unlisten = stop;
    });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [reset]);

  const close = useCallback(async () => {
    if (saving) return;
    setTitle("");
    setValue("");
    await ipc.closeQuickCapture();
  }, [saving]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      void close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  const save = async () => {
    const noteTitle = title.trim();
    const markdown = value.trim();
    if ((!noteTitle && !markdown) || saving) return;
    setSaving(true);
    try {
      const rel = await ipc.createNoteWithContent(
        "",
        noteTitle || "Quick note",
        markdown,
      );
      await emit(NOTES_CHANGED_EVENT, { rel });
      setTitle("");
      setValue("");
      await ipc.closeQuickCapture();
    } catch (error) {
      setSaving(false);
      toast.error("Note could not be captured", {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <motion.main
      key={openNonce}
      initial={{ opacity: 0, y: 6, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.14, ease: EASE_OUT }}
      className="h-full overflow-hidden border border-line bg-bg shadow-2xl shadow-black/20 dark:shadow-black/60"
    >
      <header data-tauri-drag-region className="flex items-center gap-3 px-4 pb-2 pt-4">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-panel text-muted">
          <Feather size={15} strokeWidth={1.8} />
        </div>
        <div className="pointer-events-none">
          <h1 className="text-[14px] font-semibold tracking-[-0.01em]">Quick capture</h1>
          <p className="mt-0.5 text-[11.5px] text-faint">Save a thought without leaving your flow</p>
        </div>
        <button
          type="button"
          aria-label="Close Quick Capture"
          onClick={() => void close()}
          className="ml-auto grid h-8 w-8 place-items-center rounded-md text-faint transition-colors hover:bg-hover hover:text-ink"
        >
          <X size={15} strokeWidth={2} />
        </button>
      </header>
      <div className="px-4 pb-4">
        <input
          ref={titleRef}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="mb-2 h-10 w-full rounded-xl bg-panel px-3.5 text-[14px] font-medium text-ink outline-none placeholder:text-faint focus:ring-1 focus:ring-line"
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            if (event.metaKey || event.ctrlKey) void save();
            else textareaRef.current?.focus();
          }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Write something worth keeping…"
          rows={6}
          className="w-full resize-none rounded-xl bg-panel px-3.5 py-3 text-[14px] leading-6 text-ink outline-none placeholder:text-faint focus:ring-1 focus:ring-line"
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void save();
            }
          }}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] text-faint">
            <span className="flex items-center gap-0.5 rounded border border-line px-1.5 py-0.5 font-mono">
              ⌘ <CornerDownLeft size={10} strokeWidth={2} />
            </span>
            to save
          </span>
          <Button
            size="sm"
            disabled={(!title.trim() && !value.trim()) || saving}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save note"}
          </Button>
        </div>
      </div>
      <Toaster position="top-center" offset={12} />
    </motion.main>
  );
}
