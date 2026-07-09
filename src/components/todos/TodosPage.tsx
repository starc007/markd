import { Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Todo } from "@/lib/types";
import { EASE_OUT } from "@/lib/ease";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { TagList } from "@/components/ui/TagList";
import { TagPicker } from "@/components/ui/TagPicker";
import { TagRail } from "@/components/ui/TagRail";
import { Tooltip } from "@/components/ui/Tooltip";
import { cx } from "@/lib/utils";
import { useTodos } from "@/stores/todos";

export function TodosPage() {
  const { todos, tagRegistry, loaded, load, add, deleteTag } = useTodos();
  const tagFilter = useTodos((s) => s.tagFilter);
  const setTagFilter = useTodos((s) => s.setTagFilter);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const completedCount = todos.filter((t) => t.done).length;
  const shown = tagFilter
    ? todos.filter((t) => t.tags.includes(tagFilter))
    : todos;

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const todo of todos) {
      for (const tag of todo.tags) counts[tag] = (counts[tag] ?? 0) + 1;
    }
    return counts;
  }, [todos]);

  const submit = () => {
    const value = inputRef.current?.value.trim();
    if (!value) return;
    add(value, tagFilter ? [tagFilter] : undefined);
    if (inputRef.current) inputRef.current.value = "";
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
          total={todos.length}
        />

        <div className="min-w-0 flex-1">
        <div className="flex min-h-7 items-center justify-between">
          <p className="text-[13px] text-muted">
            Things you&apos;ll totally get around to.
          </p>
          <AnimatePresence>
            {completedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.14, ease: EASE_OUT }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[12px] text-faint hover:text-ink"
                  onClick={() => useTodos.getState().clearCompleted()}
                >
                  Clear completed · {completedCount}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center gap-2.5 border-b border-line pb-3">
          <Plus size={16} strokeWidth={2} className="shrink-0 text-faint" />
          <input
            ref={inputRef}
            placeholder="Add a task…"
            className="w-full bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
          />
        </div>

        <motion.div
          key={tagFilter ?? "all"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}
          className="relative mt-2"
        >
          <AnimatePresence initial={false}>
            {shown.map((todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                activeTag={tagFilter}
                onTagClick={setTagFilter}
              />
            ))}
          </AnimatePresence>
          <AnimatePresence>
            {loaded && shown.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                className="absolute inset-x-0 top-6 text-center text-[13px] text-faint"
              >
                {tagFilter ? `No tasks tagged #${tagFilter}.` : "Nothing here yet."}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
        </div>
      </div>
    </div>
  );
}

function TodoRow({
  todo,
  activeTag,
  onTagClick,
}: {
  todo: Todo;
  activeTag: string | null;
  onTagClick: (tag: string) => void;
}) {
  const toggle = useTodos((s) => s.toggle);
  const remove = useTodos((s) => s.remove);
  const updateText = useTodos((s) => s.updateText);
  const setTags = useTodos((s) => s.setTags);
  const registry = useTodos((s) => s.tagRegistry);
  const [editing, setEditing] = useState(false);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) editRef.current?.focus();
  }, [editing]);

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="group flex items-start gap-2.5 rounded-md px-1 py-[5px]"
    >
      <div className="flex h-7 shrink-0 items-center">
        <button
          type="button"
          aria-label={todo.done ? "Mark as open" : "Mark as done"}
          onClick={() => toggle(todo.id)}
          className={cx(
            "relative grid h-[17px] w-[17px] place-items-center rounded-[5px] border-[1.5px] transition-colors duration-100",
            todo.done
              ? "border-invert bg-invert"
              : "border-faint hover:border-ink",
          )}
        >
          <svg
            width="9"
            height="8"
            viewBox="0 0 10 8"
            className={cx(
              "transition-opacity duration-100",
              todo.done ? "opacity-100" : "opacity-0",
            )}
          >
            <path
              d="M1 4.2 3.8 7 9 1"
              fill="none"
              stroke="var(--invert-ink)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-h-7 items-center">
          {editing ? (
            <input
              ref={editRef}
              defaultValue={todo.text}
              className="w-full bg-transparent text-[14px] text-ink outline-none"
              onBlur={(event) => {
                setEditing(false);
                const value = event.target.value.trim();
                if (value && value !== todo.text) updateText(todo.id, value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "Escape") {
                  event.currentTarget.blur();
                }
              }}
            />
          ) : (
            <span
              className={cx(
                "cursor-pointer select-none whitespace-pre-wrap break-words text-[14px] transition-colors duration-150",
                todo.done && "text-faint line-through decoration-faint",
              )}
              onClick={() => toggle(todo.id)}
              onDoubleClick={() => !todo.done && setEditing(true)}
            >
              {todo.text}
            </span>
          )}
        </div>

        {todo.tags.length > 0 && (
          <div className="mb-1">
            <TagList
              tags={todo.tags}
              activeTag={activeTag}
              onTagClick={onTagClick}
              onChange={(tags) => setTags(todo.id, tags)}
              editable={false}
              removable
            />
          </div>
        )}
      </div>

      <div className="flex h-7 shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-100 group-hover:opacity-100">
        <TagPicker
          assigned={todo.tags}
          registry={registry}
          onChange={(tags) => setTags(todo.id, tags)}
        />
        <CopyButton value={todo.text} />
        <Tooltip label="Delete" side="top">
          <button
            type="button"
            onClick={() => remove(todo.id)}
            className="grid h-7 w-7 place-items-center rounded-md text-faint transition-colors duration-100 hover:bg-active hover:text-ink"
          >
            <X size={13} strokeWidth={2} />
          </button>
        </Tooltip>
      </div>
    </motion.div>
  );
}
