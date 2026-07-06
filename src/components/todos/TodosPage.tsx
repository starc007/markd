import { Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Todo } from "@/lib/types";
import { EASE_OUT } from "@/lib/ease";
import { Button } from "@/components/ui/Button";
import { TagList } from "@/components/ui/TagList";
import { Tooltip } from "@/components/ui/Tooltip";
import { cx } from "@/lib/utils";
import { useTodos } from "@/stores/todos";

export function TodosPage() {
  const { todos, loaded, load, add } = useTodos();
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [load]);

  const completedCount = todos.filter((t) => t.done).length;
  const shown = tagFilter
    ? todos.filter((t) => t.tags.includes(tagFilter))
    : todos;

  const submit = () => {
    const value = inputRef.current?.value.trim();
    if (!value) return;
    add(value);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="page-scroll">
      <div className="mx-auto w-full max-w-[720px] px-8 pb-24 pt-6">
        <div className="flex items-baseline justify-between">
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

        <AnimatePresence>
          {tagFilter && (
            <FilterBar tag={tagFilter} onClear={() => setTagFilter(null)} />
          )}
        </AnimatePresence>

        <div className="mt-2">
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
          {loaded && shown.length === 0 && (
            <p className="pt-6 text-center text-[13px] text-faint">
              {tagFilter ? `No tasks tagged #${tagFilter}.` : "Nothing here yet."}
            </p>
          )}
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
  const [editing, setEditing] = useState(false);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) editRef.current?.focus();
  }, [editing]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="group flex items-start gap-2.5 rounded-md px-1 py-[7px]"
    >
      <button
        type="button"
        aria-label={todo.done ? "Mark as open" : "Mark as done"}
        onClick={() => toggle(todo.id)}
        className={cx(
          "relative mt-[3px] grid h-[17px] w-[17px] shrink-0 place-items-center rounded-[5px] border-[1.5px] transition-colors duration-100",
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

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            ref={editRef}
            defaultValue={todo.text}
            className="w-full bg-transparent py-[3px] text-[14px] text-ink outline-none"
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
              "block cursor-pointer select-none truncate py-[3px] text-[14px] transition-colors duration-150",
              todo.done && "text-faint line-through decoration-faint",
            )}
            onClick={() => toggle(todo.id)}
            onDoubleClick={() => !todo.done && setEditing(true)}
          >
            {todo.text}
          </span>
        )}

        <div className="mt-1">
          <TagList
            tags={todo.tags}
            activeTag={activeTag}
            onTagClick={onTagClick}
            onChange={(tags) => setTags(todo.id, tags)}
          />
        </div>
      </div>

      <Tooltip label="Delete" side="left">
        <button
          type="button"
          onClick={() => remove(todo.id)}
          className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded text-faint opacity-0 transition-opacity duration-100 hover:text-ink group-hover:opacity-100"
        >
          <X size={13} strokeWidth={2} />
        </button>
      </Tooltip>
    </motion.div>
  );
}

function FilterBar({ tag, onClear }: { tag: string; onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.16, ease: EASE_OUT }}
      className="overflow-hidden"
    >
      <div className="mt-3 flex items-center gap-2 text-[12px] text-muted">
        <span>
          Filtered by <span className="font-medium text-ink">#{tag}</span>
        </span>
        <button
          type="button"
          className="text-faint underline-offset-2 transition-colors hover:text-ink hover:underline"
          onClick={onClear}
        >
          clear
        </button>
      </div>
    </motion.div>
  );
}
