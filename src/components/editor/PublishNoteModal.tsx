import { openUrl } from "@tauri-apps/plugin-opener";
import {
  Check,
  Copy,
  ExternalLink,
  Globe2,
  LogIn,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { IpcError, ipc } from "@/lib/ipc";
import type { PublishedShare } from "@/lib/types";
import { noteTitle } from "@/lib/utils";

type BusyAction = "publish" | "update" | "revoke" | null;

export function PublishNoteModal({
  open,
  onClose,
  rel,
  markdown,
}: {
  open: boolean;
  onClose: () => void;
  rel: string;
  markdown: string;
}) {
  const [title, setTitle] = useState(noteTitle(rel));
  const [share, setShare] = useState<PublishedShare | null>(null);
  const [account, setAccount] = useState<{ email: string; plan: "free" | "cloud" } | null>(null);
  const [outdated, setOutdated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [error, setError] = useState<{ kind: string; message: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    let disposed = false;
    setLoading(true);
    setAccount(null);
    setError(null);
    setConfirmRevoke(false);
    void ipc
      .publishedNoteStatus(rel, markdown)
      .then((status) => {
        if (disposed) return;
        setShare(status.share);
        setAccount(status.account);
        setOutdated(status.isOutdated);
        setTitle(status.share?.title ?? noteTitle(rel));
      })
      .catch((cause) => {
        if (disposed) return;
        setError({
          kind: cause instanceof IpcError ? cause.kind : "other",
          message: cause instanceof Error ? cause.message : String(cause),
        });
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [open, rel, markdown]);

  const run = async (action: Exclude<BusyAction, null>) => {
    setBusy(action);
    setError(null);
    try {
      if (action === "revoke") {
        await ipc.revokePublishedNote(rel);
        setShare(null);
        setOutdated(false);
        setConfirmRevoke(false);
        toast("Note unpublished");
        return;
      }
      const next =
        action === "publish"
          ? await ipc.publishNote(rel, title.trim(), markdown)
          : await ipc.updatePublishedNote(rel, title.trim(), markdown);
      setShare(next);
      setTitle(next.title);
      setOutdated(false);
      toast(action === "publish" ? "Note published" : "Published note updated");
    } catch (cause) {
      setError({
        kind: cause instanceof IpcError ? cause.kind : "other",
        message: cause instanceof Error ? cause.message : String(cause),
      });
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    if (!share) return;
    await navigator.clipboard.writeText(share.url);
    toast("Public link copied");
  };

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      ariaLabel="Publish note on the web"
      className="w-[480px]"
    >
      <header className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-panel text-muted">
          <Globe2 size={15.5} strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold tracking-[-0.01em]">
            Publish on the web
          </h2>
          <p className="mt-0.5 text-[10.5px] text-faint">
            Create an unlisted public snapshot
          </p>
        </div>
        <button
          type="button"
          aria-label="Close publishing"
          disabled={Boolean(busy)}
          onClick={onClose}
          className="ml-auto grid h-8 w-8 place-items-center rounded-md text-faint transition-colors duration-100 hover:bg-hover hover:text-ink disabled:opacity-40"
        >
          <X size={15} strokeWidth={2} />
        </button>
      </header>

      <div className="px-5 py-5">
        {loading ? (
          <div className="space-y-3" aria-label="Loading publishing status">
            <div className="h-4 w-32 animate-pulse rounded bg-panel" />
            <div className="h-10 animate-pulse rounded-lg bg-panel" />
            <div className="h-20 animate-pulse rounded-lg bg-panel" />
          </div>
        ) : !account ? (
          <div className="py-2 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-panel text-muted">
              <LogIn size={17} strokeWidth={1.8} />
            </div>
            <h3 className="mt-4 text-[13px] font-semibold text-ink">
              Sign in to publish
            </h3>
            <p className="mx-auto mt-1.5 max-w-[330px] text-[11.5px] leading-5 text-muted">
              Public pages belong to your Markd account, so you can update or remove
              them from any signed-in device.
            </p>
            <p className="mt-2 text-[10.5px] text-faint">
              Free accounts can publish one active note.
            </p>
            {error && (
              <div role="alert" className="mt-4 rounded-lg border border-danger/20 bg-danger/6 px-3 py-2.5 text-[11.5px] text-danger">
                {error.message}
              </div>
            )}
            <div className="mt-5 flex justify-center gap-2 border-t border-line-soft pt-4">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openUrl("https://usemarkd.app/login?source=desktop")}
              >
                <LogIn size={13} strokeWidth={1.9} />
                Sign in to Markd
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <label className="block">
              <span className="text-[11.5px] font-medium text-muted">Page title</span>
              <input
                value={title}
                maxLength={200}
                disabled={Boolean(busy)}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-line bg-bg px-3 text-[13px] text-ink outline-none transition-colors focus:border-ink disabled:opacity-60"
              />
            </label>

            {share ? (
              <div className="rounded-xl bg-panel p-3.5">
                <div className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-invert text-invert-ink">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  <span className="text-[12px] font-medium text-ink">Published</span>
                  {outdated && (
                    <span className="ml-auto rounded-full border border-line bg-bg px-2 py-0.5 text-[9.5px] font-medium text-faint">
                      Local changes
                    </span>
                  )}
                </div>
                <p className="mt-3 truncate font-mono text-[10.5px] text-muted">
                  {share.url}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="bg-bg" onClick={copyLink}>
                    <Copy size={12.5} strokeWidth={1.9} />
                    Copy link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-bg"
                    onClick={() => openUrl(share.url)}
                  >
                    <ExternalLink size={12.5} strokeWidth={1.9} />
                    Open
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-panel p-3.5 text-[12px] leading-5 text-muted">
                Publishing uploads a separate snapshot. Future edits remain private until
                you update the published version.
                <p className="mt-2 text-[10.5px] text-faint">
                  {account.plan === "cloud"
                    ? `Signed in as ${account.email}`
                    : `Free account · one active public note · ${account.email}`}
                </p>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-danger/20 bg-danger/6 px-3 py-2.5 text-[11.5px] leading-5 text-danger"
              >
                {error.message}
                {error.kind === "cloud_subscription_required" && (
                  <p className="mt-1 text-[10.5px] opacity-75">
                    Account creation and Markd Cloud checkout are the next step.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 border-t border-line-soft pt-4">
              {share ? (
                <>
                  {!confirmRevoke ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirmRevoke(true)}
                    >
                      <Trash2 size={13} strokeWidth={1.8} />
                      Stop publishing
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-danger">Remove the public page?</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmRevoke(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={Boolean(busy)}
                        onClick={() => run("revoke")}
                      >
                        {busy === "revoke" ? "Removing…" : "Remove"}
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    className="ml-auto"
                    disabled={!title.trim() || Boolean(busy) || (!outdated && title === share.title)}
                    onClick={() => run("update")}
                  >
                    <RefreshCw size={13} strokeWidth={1.8} />
                    {busy === "update" ? "Updating…" : "Update page"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="ml-auto"
                    disabled={!title.trim() || Boolean(busy)}
                    onClick={() => run("publish")}
                  >
                    <Globe2 size={13} strokeWidth={1.8} />
                    {busy === "publish" ? "Publishing…" : "Publish note"}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
