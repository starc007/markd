import { openUrl } from "@tauri-apps/plugin-opener";
import { Globe, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Bookmark } from "@/lib/types";
import { CopyButton } from "@/components/ui/CopyButton";
import { TagList } from "@/components/ui/TagList";
import { TagPicker } from "@/components/ui/TagPicker";
import { TagRail } from "@/components/ui/TagRail";
import { Tooltip } from "@/components/ui/Tooltip";
import { EASE_OUT } from "@/lib/ease";
import { cx, hostOf } from "@/lib/utils";
import { useBookmarks } from "@/stores/bookmarks";

const URL_RE = /^https?:\/\/\S+$/i;

export function BookmarksPage() {
  const { bookmarks, tagRegistry, loaded, load, add, deleteTag } = useBookmarks();
  const tagFilter = useBookmarks((s) => s.tagFilter);
  const setTagFilter = useBookmarks((s) => s.setTagFilter);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmed = query.trim();
  const isUrl = URL_RE.test(trimmed) || /^[\w-]+\.[a-z]{2,}(\/\S*)?$/i.test(trimmed);

  const filtered = useMemo(() => {
    const q = trimmed.toLowerCase();
    return bookmarks.filter((b) => {
      if (tagFilter && !b.tags.includes(tagFilter)) return false;
      if (!q || isUrl) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.tags.some((tag) => tag.includes(q))
      );
    });
  }, [bookmarks, trimmed, isUrl, tagFilter]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const bookmark of bookmarks) {
      for (const tag of bookmark.tags) counts[tag] = (counts[tag] ?? 0) + 1;
    }
    return counts;
  }, [bookmarks]);

  const submit = () => {
    if (!trimmed) return;
    if (isUrl) {
      add(trimmed, tagFilter ? [tagFilter] : undefined);
      setQuery("");
    }
  };

  return (
    <div className="page-scroll">
      <div className="mx-auto flex w-full max-w-[940px] gap-8 px-8 pb-24 pt-6">
        <TagRail
          tags={tagRegistry}
          activeTag={tagFilter}
          onSelect={setTagFilter}
          onDelete={deleteTag}
          counts={tagCounts}
          total={bookmarks.length}
        />

        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-muted">
            Stash links here — your memory clearly isn&apos;t up to the job.
          </p>

          <div className="mt-4 flex items-center gap-2.5 border-b border-line pb-3">
            <Search size={15} strokeWidth={2} className="shrink-0 text-faint" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search bookmarks, or paste a link…"
              className="w-full bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
            />
            {isUrl && (
              <span className="shrink-0 text-[11.5px] text-faint">↵ to save</span>
            )}
          </div>

          <motion.div
            key={tagFilter ?? "all"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            className="relative mt-2"
          >
            <AnimatePresence initial={false}>
              {filtered.map((bookmark) => (
                <BookmarkRow
                  key={bookmark.id}
                  bookmark={bookmark}
                  activeTag={tagFilter}
                  onTagClick={(tag) =>
                    setTagFilter(tagFilter === tag ? null : tag)
                  }
                />
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {loaded && filtered.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                  className="absolute inset-x-0 top-10 text-center text-[13px] text-faint"
                >
                  {bookmarks.length === 0
                    ? "Paste a link above to save it."
                    : tagFilter
                      ? `Nothing tagged #${tagFilter}.`
                      : `No bookmarks match “${trimmed}”.`}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function BookmarkRow({
  bookmark,
  activeTag,
  onTagClick,
}: {
  bookmark: Bookmark;
  activeTag: string | null;
  onTagClick: (tag: string) => void;
}) {
  const remove = useBookmarks((s) => s.remove);
  const updateTitle = useBookmarks((s) => s.updateTitle);
  const setTags = useBookmarks((s) => s.setTags);
  const registry = useBookmarks((s) => s.tagRegistry);
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
      layout="position"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="group flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors duration-100 hover:bg-hover"
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
        {bookmark.tags.length > 0 && (
          <div className="mt-1.5">
            <TagList
              tags={bookmark.tags}
              activeTag={activeTag}
              onTagClick={onTagClick}
              onChange={(tags) => setTags(bookmark.id, tags)}
              editable={false}
              removable
            />
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 self-start opacity-0 transition-opacity duration-100 group-hover:opacity-100">
        <TagPicker
          assigned={bookmark.tags}
          registry={registry}
          onChange={(tags) => setTags(bookmark.id, tags)}
        />
        <CopyButton value={bookmark.url} label="Copy link" side="top" />
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
