import { openUrl } from "@tauri-apps/plugin-opener";
import { Check, Copy, Globe, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Bookmark } from "@/lib/types";
import { ActionSwapIcon } from "@/components/motion/action-swap";
import { TagList } from "@/components/ui/TagList";
import { TagPicker } from "@/components/ui/TagPicker";
import { Tooltip } from "@/components/ui/Tooltip";
import { EASE_OUT, SPRING_LAYOUT } from "@/lib/ease";
import { tagColor } from "@/lib/tagColor";
import { cx, hostOf } from "@/lib/utils";
import { useBookmarks } from "@/stores/bookmarks";

const URL_RE = /^https?:\/\/\S+$/i;

export function BookmarksPage() {
  const { bookmarks, loaded, load, add } = useBookmarks();
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

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
        <TagRail activeTag={tagFilter} onSelect={setTagFilter} />

        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-muted">
            Stash links here — your memory clearly isn&apos;t up to the job.
          </p>

          <div className="mt-4 flex items-center gap-2.5 border-b border-line pb-3">
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
              <span className="shrink-0 text-[11.5px] text-faint">↵ to save</span>
            )}
          </div>

          <div className="mt-2">
            <AnimatePresence initial={false}>
              {filtered.map((bookmark) => (
                <BookmarkRow
                  key={bookmark.id}
                  bookmark={bookmark}
                  activeTag={tagFilter}
                  onTagClick={(tag) =>
                    setTagFilter((cur) => (cur === tag ? null : tag))
                  }
                />
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {loaded && filtered.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.18,
                  ease: EASE_OUT,
                  delay: 0.14,
                }}
                className="pt-10 text-center text-[13px] text-faint"
              >
                {bookmarks.length === 0
                  ? "Paste a link above to save it."
                  : tagFilter
                    ? `Nothing tagged #${tagFilter}.`
                    : `No bookmarks match “${trimmed}”.`}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TagRail({
  activeTag,
  onSelect,
}: {
  activeTag: string | null;
  onSelect: (tag: string | null) => void;
}) {
  const tags = useBookmarks((s) => s.tagRegistry);
  const deleteTag = useBookmarks((s) => s.deleteTag);

  return (
    <aside className="sticky top-0 hidden w-[152px] shrink-0 sm:block">
      <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
        Tags
      </p>
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cx(
            "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
            activeTag === null
              ? "text-ink"
              : "text-muted hover:bg-hover hover:text-ink",
          )}
        >
          {activeTag === null && (
            <motion.span
              layoutId="rail-active"
              transition={SPRING_LAYOUT}
              className="absolute inset-0 rounded-md bg-active"
            />
          )}
          <span className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full border border-faint" />
          <span className="relative z-10 truncate">All</span>
        </button>

        {tags.map((tag) => {
          const active = activeTag === tag;
          return (
            <div key={tag} className="group/rail flex items-center">
              <button
                type="button"
                onClick={() => onSelect(active ? null : tag)}
                className={cx(
                  "relative flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
                  active ? "text-ink" : "text-muted hover:bg-hover hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="rail-active"
                    transition={SPRING_LAYOUT}
                    className="absolute inset-0 rounded-md bg-active"
                  />
                )}
                <span
                  className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tagColor(tag) }}
                />
                <span className="relative z-10 truncate">{tag}</span>
              </button>
              <button
                type="button"
                aria-label={`Delete tag ${tag}`}
                onClick={() => deleteTag(tag)}
                className="grid h-6 w-6 shrink-0 place-items-center rounded text-faint opacity-0 transition-opacity hover:text-danger group-hover/rail:opacity-100"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>

      {tags.length === 0 && (
        <p className="mt-1 px-2 text-[12px] leading-relaxed text-faint">
          Create a tag from the top bar to start filtering.
        </p>
      )}
    </aside>
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
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editing) {
      editRef.current?.focus();
      editRef.current?.select();
    }
  }, [editing]);

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(bookmark.url);
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1400);
  };

  const showImage = bookmark.image && !imageFailed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="group flex cursor-default items-start gap-3 rounded-lg px-2 py-2 transition-colors duration-100 hover:bg-hover"
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
              editable={false}
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
        <RowAction label={copied ? "Copied" : "Copy link"} onClick={copyLink}>
          <ActionSwapIcon
            value={copied ? "done" : "copy"}
            animation="roll"
            className="h-[13px] w-[13px]"
          >
            {copied ? (
              <Check size={13} strokeWidth={2} />
            ) : (
              <Copy size={13} strokeWidth={2} />
            )}
          </ActionSwapIcon>
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
