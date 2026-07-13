import { Link2, X } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { BACKLINKS_CHANGED } from "@/lib/backlinks";
import { ipc } from "@/lib/ipc";
import type { BacklinkMention } from "@/lib/types";
import { useTabs } from "@/stores/tabs";
import { useVault } from "@/stores/vault";

export const LinkedMentions = memo(function LinkedMentions({
  rel,
  active,
  onClose,
}: {
  rel: string;
  active: boolean;
  onClose: () => void;
}) {
  const [mentions, setMentions] = useState<BacklinkMention[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!active) return;
    const request = ++requestId.current;
    setLoading(true);
    try {
      const next = await ipc.backlinksFor(rel);
      if (request === requestId.current) setMentions(next);
    } catch {
      if (request === requestId.current) setMentions([]);
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [active, rel]);

  useEffect(() => {
    if (!active) {
      requestId.current += 1;
      return;
    }
    void load();
    const refresh = () => void load();
    window.addEventListener(BACKLINKS_CHANGED, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      requestId.current += 1;
      window.removeEventListener(BACKLINKS_CHANGED, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [active, load]);

  const openMention = (mention: BacklinkMention) => {
    const vault = useVault.getState();
    vault.expandTo(mention.sourceRel);
    vault.setView({ type: "note", rel: mention.sourceRel });
    useTabs
      .getState()
      .requestMentionFocus(mention.sourceRel, rel, mention.occurrence);
  };

  return (
    <aside className="flex h-full w-[280px] flex-col border-l border-line-soft bg-panel">
      <div className="flex h-11 shrink-0 items-center gap-2 px-3">
        <Link2 size={14} strokeWidth={1.9} className="text-muted" />
        <h2 className="text-[12.5px] font-semibold text-ink">
          Linked mentions
        </h2>
        <span className="rounded-full bg-active px-1.5 py-0.5 text-[10px] tabular-nums text-muted">
          {loading ? "·" : mentions.length}
        </span>
        <Tooltip label="Close linked mentions" side="left">
          <button
            type="button"
            onClick={onClose}
            className="ml-auto grid h-7 w-7 place-items-center rounded-md text-faint transition-colors duration-100 hover:bg-hover hover:text-ink"
          >
            <X size={14} strokeWidth={1.9} />
          </button>
        </Tooltip>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-1">
        {!loading && mentions.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <p className="text-[12.5px] text-faint">No linked mentions yet.</p>
            <p className="mt-1 text-[11.5px] leading-5 text-faint">
              Notes linking here will appear in this panel.
            </p>
          </div>
        ) : null}
        {mentions.map((mention) => (
          <button
            key={`${mention.sourceRel}:${mention.line}:${mention.occurrence}`}
            type="button"
            onClick={() => openMention(mention)}
            className="group block w-full rounded-md px-2 py-2.5 text-left transition-colors duration-100 hover:bg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink"
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[12.5px] font-medium text-ink">
                {mention.sourceRel.replace(/\.md$/i, "")}
              </span>
              <span className="shrink-0 text-[10.5px] tabular-nums text-faint">
                Line {mention.line}
              </span>
            </span>
            <span className="mt-1 block line-clamp-3 text-[12px] leading-[1.5] text-muted">
              {mention.context || mention.sourceRel}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
});
