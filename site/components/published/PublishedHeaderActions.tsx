"use client";

import { Share } from "lucide-react";
import { useState } from "react";

export function PublishedHeaderActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      // User cancelled the native share sheet.
    }
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        aria-label={copied ? "Link copied" : "Share note"}
        onClick={share}
        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <Share size={18} strokeWidth={2} />
      </button>
      <a
        href="/download"
        className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        Get Markd Free
      </a>
    </div>
  );
}
