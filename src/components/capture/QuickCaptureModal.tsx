import { CornerDownLeft, Feather, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useUi } from "@/stores/ui";
import { useVault } from "@/stores/vault";

export function QuickCaptureModal() {
  const open = useUi((state) => state.quickCaptureOpen);
  const setOpen = useUi((state) => state.setQuickCaptureOpen);
  const createCapturedNote = useVault((state) => state.createCapturedNote);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => titleRef.current?.focus());
  }, [open]);

  const close = () => {
    if (saving) return;
    setOpen(false);
    setTitle("");
    setValue("");
  };

  const save = async () => {
    const markdown = value.trim();
    const noteTitle = title.trim();
    if ((!noteTitle && !markdown) || saving) return;
    setSaving(true);
    const saved = await createCapturedNote(noteTitle || "Quick note", markdown);
    setSaving(false);
    if (saved) {
      setOpen(false);
      setTitle("");
      setValue("");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      ariaLabel="Quick capture"
      align="top"
      className="mt-[18vh] w-[500px]"
    >
      <header className="flex items-center gap-3 px-4 pb-2 pt-4">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-panel text-muted">
          <Feather size={15} strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold tracking-[-0.01em]">Quick capture</h2>
          <p className="mt-0.5 text-[11.5px] text-faint">Save a thought without leaving your flow</p>
        </div>
        <button
          type="button"
          aria-label="Close Quick Capture"
          onClick={close}
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
    </Modal>
  );
}
