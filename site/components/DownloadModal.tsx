"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { EASE_OUT } from "@/lib/ease";

const CMD = "xattr -dr com.apple.quarantine /Applications/Markd.app";

export const DOWNLOAD_EVENT = "markd:download";

export function DownloadModal() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onDownload = () => setOpen(true);
    window.addEventListener(DOWNLOAD_EVENT, onDownload);
    return () => window.removeEventListener(DOWNLOAD_EVENT, onDownload);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const copy = () => {
    navigator.clipboard?.writeText(CMD).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: EASE_OUT }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-strong bg-paper shadow-[0_40px_90px_-40px_rgba(0,0,0,0.5)]"
          >
            <div className="p-6 sm:p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                Downloading Markd…
              </p>
              <h3 className="mt-2 font-serif text-[24px] leading-tight text-foreground">
                One quick step on macOS
              </h3>
              <p className="mt-3 text-[14px] leading-6 text-muted-foreground">
                Markd is signed but not yet notarized, so macOS blocks it on the
                first launch. Once it finishes downloading, open it once — either
                way below.
              </p>

              <p className="mt-5 text-[12.5px] font-semibold text-foreground">
                Terminal
              </p>
              <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border bg-background p-1.5 pl-3">
                <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-fg-soft">
                  {CMD}
                </code>
                <button
                  type="button"
                  onClick={copy}
                  className="shrink-0 rounded-md border border-border-strong bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-hover"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <p className="mt-4 text-[12.5px] font-semibold text-foreground">
                Or in Settings
              </p>
              <p className="mt-1 text-[13.5px] leading-6 text-muted-foreground">
                Double-click Markd → <span className="text-foreground">Done</span> →{" "}
                <span className="text-foreground">System Settings → Privacy &amp; Security</span>{" "}
                → <span className="text-foreground">Open Anyway</span>. macOS
                remembers it after that.
              </p>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-6 h-11 w-full rounded-[7px] bg-invert text-[15px] font-medium text-invert-ink transition-opacity hover:opacity-90"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
