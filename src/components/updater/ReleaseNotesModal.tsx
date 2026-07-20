import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useUpdater } from "@/stores/updater";

export function ReleaseNotesModal() {
  const open = useUpdater((state) => state.releaseNotesOpen);
  const update = useUpdater((state) => state.update);
  const status = useUpdater((state) => state.status);
  const install = useUpdater((state) => state.install);
  const dismiss = useUpdater((state) => state.dismissReleaseNotes);
  const busy = status === "downloading" || status === "ready";
  const notes = update?.body?.trim();

  return (
    <Modal
      open={open && Boolean(update)}
      onClose={() => !busy && dismiss()}
      ariaLabel={`What's new in Markd ${update?.version ?? ""}`.trim()}
      className="w-[460px]"
    >
      <header className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-panel text-muted">
          <Sparkles size={15.5} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold tracking-[-0.01em]">
            What&apos;s new in Markd
          </h2>
          <p className="mt-0.5 text-[10.5px] text-faint">
            Version {update?.version}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close release notes"
          disabled={busy}
          onClick={dismiss}
          className="ml-auto grid h-8 w-8 place-items-center rounded-md text-faint transition-colors duration-100 hover:bg-hover hover:text-ink disabled:opacity-40"
        >
          <X size={15} strokeWidth={2} />
        </button>
      </header>

      <div className="px-5 py-5">
        <div className="max-h-64 overflow-y-auto rounded-xl bg-panel px-4 py-3.5">
          <p className="whitespace-pre-line text-[12.5px] leading-6 text-muted">
            {notes || "This release includes new features and improvements."}
          </p>
        </div>
        <p className="mt-3 text-[10.5px] leading-4 text-faint">
          Markd will restart after the update is installed.
        </p>
      </div>

      <footer className="flex justify-end gap-2 border-t border-line-soft px-5 py-3.5">
        <Button variant="ghost" size="sm" disabled={busy} onClick={dismiss}>
          Not now
        </Button>
        <Button
          variant="primary"
          size="sm"
          loading={busy}
          onClick={() => void install()}
        >
          {busy ? "Updating" : "Update & restart"}
        </Button>
      </footer>
    </Modal>
  );
}
