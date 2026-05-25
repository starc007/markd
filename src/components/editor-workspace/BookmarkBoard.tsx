import {
  ArrowUpRight01Icon,
  Bookmark01Icon,
  BookmarkAdd01Icon,
  Cancel01Icon,
  Delete02Icon,
  Edit02Icon,
  Link01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button, EmptyState } from "@/components/ui";
import type { BookmarkRecord } from "@/lib/types";
import { Board } from "./Board";

function getBookmarkHost(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function BookmarkBoard({
  bookmarks,
  onDelete,
  onSave,
}: {
  bookmarks: BookmarkRecord[];
  onDelete: (id: string) => void;
  onSave: (
    bookmark: Partial<BookmarkRecord> & Pick<BookmarkRecord, "title" | "url">,
  ) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", url: "" });

  const startEditing = (bookmark?: BookmarkRecord) => {
    setEditingId(bookmark?.id ?? "new");
    setDraft({
      title: bookmark?.title ?? "",
      url: bookmark?.url ?? "https://",
    });
  };

  const saveDraft = () => {
    const title = draft.title.trim();
    const url = draft.url.trim();
    if (!title || !url) return;
    onSave({
      id: editingId === "new" ? undefined : editingId ?? undefined,
      title,
      url,
    });
    setEditingId(null);
  };

  return (
    <Board
      title="Bookmarks"
      icon={Bookmark01Icon}
      description="Saved links with enough context to find the right reference quickly."
      meta={
        <Button
          className="min-h-8 rounded-xl px-2.5 text-xs"
          onClick={() => startEditing()}
        >
          <HugeiconsIcon icon={BookmarkAdd01Icon} size={14} color="currentColor" />
          Add
        </Button>
      }
    >
      {bookmarks.length === 0 && editingId !== "new" ? (
        <EmptyState
          icon={Bookmark01Icon}
          title="No bookmarks yet"
          description="Save useful links here so references stay close to the notes they support."
          action={
            <Button onClick={() => startEditing()}>
              <HugeiconsIcon icon={BookmarkAdd01Icon} size={15} color="currentColor" />
              Add bookmark
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line-soft bg-panel dark:border-line-soft-dark dark:bg-panel-dark">
          {editingId === "new" && (
            <form
              className="grid gap-2 border-b border-line-soft/80 p-3 dark:border-line-soft-dark/80"
              onSubmit={(event) => {
                event.preventDefault();
                saveDraft();
              }}
            >
              <input
                autoFocus
                className="h-8 rounded-xl bg-panel-soft px-2.5 text-sm font-medium text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-focus-line/40 dark:bg-panel-soft-dark dark:text-ink-dark dark:placeholder:text-muted-dark dark:focus:ring-focus-line-dark/40"
                onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))}
                placeholder="Title"
                value={draft.title}
              />
              <div className="flex gap-2">
                <input
                  className="h-8 min-w-0 flex-1 rounded-xl bg-panel-soft px-2.5 text-sm text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-focus-line/40 dark:bg-panel-soft-dark dark:text-ink-dark dark:placeholder:text-muted-dark dark:focus:ring-focus-line-dark/40"
                  onChange={(event) => setDraft((value) => ({ ...value, url: event.target.value }))}
                  placeholder="https://"
                  value={draft.url}
                />
                <button
                  className="grid h-8 w-8 place-items-center rounded-xl text-muted transition-colors hover:bg-hover hover:text-ink dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark"
                  type="submit"
                >
                  <HugeiconsIcon icon={Tick02Icon} size={15} color="currentColor" />
                </button>
                <button
                  className="grid h-8 w-8 place-items-center rounded-xl text-muted transition-colors hover:bg-hover hover:text-ink dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark"
                  onClick={() => setEditingId(null)}
                  type="button"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={15} color="currentColor" />
                </button>
              </div>
            </form>
          )}
          {bookmarks.map((bookmark) => (
            editingId === bookmark.id ? (
              <form
                className="grid gap-2 border-b border-line-soft/80 p-3 last:border-b-0 dark:border-line-soft-dark/80"
                key={bookmark.id}
                onSubmit={(event) => {
                  event.preventDefault();
                  saveDraft();
                }}
              >
                <input
                  autoFocus
                  className="h-8 rounded-xl bg-panel-soft px-2.5 text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-focus-line/40 dark:bg-panel-soft-dark dark:text-ink-dark dark:focus:ring-focus-line-dark/40"
                  onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))}
                  value={draft.title}
                />
                <div className="flex gap-2">
                  <input
                    className="h-8 min-w-0 flex-1 rounded-xl bg-panel-soft px-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-focus-line/40 dark:bg-panel-soft-dark dark:text-ink-dark dark:focus:ring-focus-line-dark/40"
                    onChange={(event) => setDraft((value) => ({ ...value, url: event.target.value }))}
                    value={draft.url}
                  />
                  <button className="grid h-8 w-8 place-items-center rounded-xl text-muted transition-colors hover:bg-hover hover:text-ink dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark" type="submit">
                    <HugeiconsIcon icon={Tick02Icon} size={15} color="currentColor" />
                  </button>
                  <button className="grid h-8 w-8 place-items-center rounded-xl text-muted transition-colors hover:bg-hover hover:text-ink dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark" onClick={() => setEditingId(null)} type="button">
                    <HugeiconsIcon icon={Cancel01Icon} size={15} color="currentColor" />
                  </button>
                </div>
              </form>
            ) : (
              <div
                className="group flex items-center gap-3 border-b border-line-soft/80 px-3 py-2.5 last:border-b-0 hover:bg-hover dark:border-line-soft-dark/80 dark:hover:bg-hover-dark"
                key={bookmark.id}
              >
                <a
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-panel-soft text-muted no-underline dark:bg-panel-soft-dark dark:text-muted-dark"
                  href={bookmark.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <HugeiconsIcon icon={Link01Icon} size={15} color="currentColor" />
                </a>
                <a
                  className="min-w-0 flex-1 text-inherit no-underline"
                  href={bookmark.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <div className="truncate text-sm font-medium text-ink dark:text-ink-dark">
                    {bookmark.title}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted dark:text-muted-dark">
                    {getBookmarkHost(bookmark.url)}
                  </div>
                </a>
                <button
                  className="grid h-8 w-8 place-items-center rounded-xl text-muted opacity-0 transition-colors hover:bg-hover hover:text-ink group-hover:opacity-100 dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark"
                  onClick={() => startEditing(bookmark)}
                  type="button"
                >
                  <HugeiconsIcon icon={Edit02Icon} size={14} color="currentColor" />
                </button>
                <button
                  className="grid h-8 w-8 place-items-center rounded-xl text-muted opacity-0 transition-colors hover:bg-hover hover:text-ink group-hover:opacity-100 dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark"
                  onClick={() => onDelete(bookmark.id)}
                  type="button"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={14} color="currentColor" />
                </button>
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  size={14}
                  color="currentColor"
                  className="text-muted opacity-0 transition-opacity group-hover:opacity-100 dark:text-muted-dark"
                />
              </div>
            )
          ))}
        </div>
      )}
    </Board>
  );
}
