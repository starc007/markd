import { openUrl } from "@tauri-apps/plugin-opener";
import { Globe, RefreshCw, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Bookmark } from "@/lib/types";
import { Tooltip } from "@/components/ui/Tooltip";
import { cx, hostOf } from "@/lib/utils";
import { useBookmarks } from "@/stores/bookmarks";

const URL_RE = /^https?:\/\/\S+$/i;

export function BookmarksPage() {
  const { bookmarks, loaded, load, add } = useBookmarks();
  const [query, setQuery] = useState("");

  useEffect(() => {
    load();
  }, [load]);

  const trimmed = query.trim();
  const isUrl = URL_RE.test(trimmed) || /^[\w-]+\.[a-z]{2,}(\/\S*)?$/i.test(trimmed);

  const filtered = useMemo(() => {
    const q = trimmed.toLowerCase();
    if (!q || isUrl) return bookmarks;
    return bookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q),
    );
  }, [bookmarks, trimmed, isUrl]);

  const submit = () => {
    if (!trimmed) return;
    if (isUrl) {
      add(trimmed);
      setQuery("");
    }
  };

  return (
    <div className="page-scroll">
      <div className="mx-auto w-full max-w-[720px] px-8 pb-24 pt-6">
        <h1 className="text-[30px] font-[680] tracking-[-0.025em]">Bookmarks</h1>

        <div className="mt-6 flex items-center gap-2.5 border-b border-line pb-3">
          <Search size={15} strokeWidth={2} className="shrink-0 text-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search bookmarks, or paste a link…"
            className="w-full bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
          />
          {isUrl && (
            <span className="shrink-0 text-[11.5px] text-faint">
              ↵ to save
            </span>
          )}
        </div>

        <div className="mt-2">
          <AnimatePresence initial={false}>
            {filtered.map((bookmark) => (
              <BookmarkRow key={bookmark.id} bookmark={bookmark} />
            ))}
          </AnimatePresence>
        </div>

        {loaded && bookmarks.length === 0 && (
          <p className="pt-10 text-center text-[13px] text-faint">
            Paste a link above to save it.
          </p>
        )}
        {loaded && bookmarks.length > 0 && filtered.length === 0 && (
          <p className="pt-10 text-center text-[13px] text-faint">
            No bookmarks match “{trimmed}”.
          </p>
        )}
      </div>
    </div>
  );
}

function BookmarkRow({ bookmark }: { bookmark: Bookmark }) {
  const remove = useBookmarks((s) => s.remove);
  const fetchMeta = useBookmarks((s) => s.fetchMeta);
  const updateTitle = useBookmarks((s) => s.updateTitle);
  const fetching = useBookmarks((s) => s.fetching.has(bookmark.id));
  const [editing, setEditing] = useState(false);
  const editRef = useRef<HTMLInputElement>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (editing) {
      editRef.current?.focus();
      editRef.current?.select();
    }
  }, [editing]);

  const showImage = bookmark.image && !imageFailed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="group flex cursor-default items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-100 hover:bg-hover"
      onClick={() => {
        if (!editing) openUrl(bookmark.url);
      }}
    >
      <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md border border-line-soft bg-hover">
        {showImage ? (
          <img
            src={bookmark.image ?? undefined}
            alt=""
            loading="lazy"
            draggable={false}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : bookmark.favicon ? (
          <div className="grid h-full w-full place-items-center">
            <img
              src={bookmark.favicon}
              alt=""
              draggable={false}
              className="h-4 w-4 rounded-sm"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </div>
        ) : (
          <div className="grid h-full w-full place-items-center">
            <Globe
              size={16}
              strokeWidth={1.5}
              className={cx("text-faint", fetching && "animate-pulse")}
            />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            ref={editRef}
            defaultValue={bookmark.title}
            className="w-full bg-transparent text-[13.5px] font-medium text-ink outline-none"
            onClick={(event) => event.stopPropagation()}
            onBlur={(event) => {
              setEditing(false);
              const value = event.target.value.trim();
              if (value && value !== bookmark.title) {
                updateTitle(bookmark.id, value);
              }
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter" || event.key === "Escape") {
                event.currentTarget.blur();
              }
            }}
          />
        ) : (
          <h3
            className="truncate text-[13.5px] font-medium text-ink"
            title={bookmark.title}
            onDoubleClick={(event) => {
              event.stopPropagation();
              setEditing(true);
            }}
          >
            {bookmark.title}
          </h3>
        )}
        <p className="mt-0.5 truncate text-[11.5px] text-faint">
          {hostOf(bookmark.url)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-100 group-hover:opacity-100">
        <RowAction
          label="Refresh preview"
          spinning={fetching}
          onClick={() => fetchMeta(bookmark.id)}
        >
          <RefreshCw
            size={13}
            strokeWidth={2}
            className={cx(fetching && "animate-spin")}
          />
        </RowAction>
        <RowAction label="Delete bookmark" onClick={() => remove(bookmark.id)}>
          <X size={13.5} strokeWidth={2} />
        </RowAction>
      </div>
    </motion.div>
  );
}

function RowAction({
  label,
  onClick,
  spinning,
  children,
}: {
  label: string;
  onClick: () => void;
  spinning?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label} side="top">
      <button
        type="button"
        disabled={spinning}
        className="grid h-7 w-7 place-items-center rounded-md text-faint transition-colors duration-100 hover:bg-active hover:text-ink"
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
      >
        {children}
      </button>
    </Tooltip>
  );
}
