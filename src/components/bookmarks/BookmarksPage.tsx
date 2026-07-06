import { openUrl } from "@tauri-apps/plugin-opener";
import { Globe, Link as LinkIcon, RefreshCw, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Bookmark } from "@/lib/types";
import { cx, hostOf } from "@/lib/utils";
import { useBookmarks } from "@/stores/bookmarks";

export function BookmarksPage() {
  const { bookmarks, loaded, load, add } = useBookmarks();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [load]);

  const submit = () => {
    const value = inputRef.current?.value.trim();
    if (!value) return;
    add(value);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="page-scroll">
      <div className="mx-auto w-full max-w-[880px] px-10 pb-24 pt-6">
        <h1 className="text-[30px] font-[680] tracking-[-0.025em]">Bookmarks</h1>

        <div className="mt-6 flex items-center gap-2.5 border-b border-line pb-3">
          <LinkIcon size={15} strokeWidth={2} className="shrink-0 text-faint" />
          <input
            ref={inputRef}
            placeholder="Paste a link…"
            className="w-full bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            onPaste={(event) => {
              const text = event.clipboardData.getData("text").trim();
              if (/^https?:\/\/\S+$/i.test(text)) {
                event.preventDefault();
                add(text);
              }
            }}
          />
        </div>

        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          <AnimatePresence initial={false}>
            {bookmarks.map((bookmark) => (
              <BookmarkCard key={bookmark.id} bookmark={bookmark} />
            ))}
          </AnimatePresence>
        </div>

        {loaded && bookmarks.length === 0 && (
          <p className="pt-10 text-center text-[13px] text-faint">
            Paste a link above to save it.
          </p>
        )}
      </div>
    </div>
  );
}

function BookmarkCard({ bookmark }: { bookmark: Bookmark }) {
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
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="group relative flex cursor-default flex-col overflow-hidden rounded-lg border border-line bg-panel transition-colors duration-150 hover:border-faint"
      onClick={() => {
        if (!editing) openUrl(bookmark.url);
      }}
    >
      <div className="relative aspect-[1.91/1] w-full overflow-hidden border-b border-line-soft bg-hover">
        {showImage ? (
          <img
            src={bookmark.image ?? undefined}
            alt=""
            loading="lazy"
            draggable={false}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <Globe
              size={22}
              strokeWidth={1.25}
              className={cx("text-faint", fetching && "animate-pulse")}
            />
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 p-3">
        {bookmark.favicon && (
          <img
            src={bookmark.favicon}
            alt=""
            draggable={false}
            className="mt-0.5 h-4 w-4 shrink-0 rounded-sm"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={editRef}
              defaultValue={bookmark.title}
              className="w-full bg-transparent text-[13px] font-medium text-ink outline-none"
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
              className="truncate text-[13px] font-medium leading-snug text-ink"
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
      </div>

      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-100 group-hover:opacity-100">
        <CardAction
          label="Refresh preview"
          spinning={fetching}
          onClick={() => fetchMeta(bookmark.id)}
        >
          <RefreshCw size={12.5} strokeWidth={2} className={cx(fetching && "animate-spin")} />
        </CardAction>
        <CardAction label="Delete bookmark" onClick={() => remove(bookmark.id)}>
          <X size={13} strokeWidth={2} />
        </CardAction>
      </div>
    </motion.article>
  );
}

function CardAction({
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
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={spinning}
      className="grid h-6 w-6 place-items-center rounded-md bg-invert/85 text-invert-ink backdrop-blur-sm transition-transform duration-100 hover:scale-105 active:scale-95"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}
