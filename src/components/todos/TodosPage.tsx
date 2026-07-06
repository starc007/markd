import { ChevronRight, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Todo } from "@/lib/types";
import { cx } from "@/lib/utils";
import { useTodos } from "@/stores/todos";

export function TodosPage() {
  const { todos, loaded, load, add } = useTodos();
  const [showCompleted, setShowCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [load]);

  const open = todos.filter((t) => !t.done);
  const completed = todos.filter((t) => t.done);

  const submit = () => {
    const value = inputRef.current?.value.trim();
    if (!value) return;
    add(value);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[560px] px-8 pb-24 pt-6">
        <h1 className="text-[30px] font-[680] tracking-[-0.025em]">Todos</h1>

        <div className="mt-6 flex items-center gap-2.5 border-b border-line pb-3">
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

        <div className="mt-2">
          <AnimatePresence initial={false}>
            {open.map((todo) => (
              <TodoRow key={todo.id} todo={todo} />
            ))}
          </AnimatePresence>
          {loaded && open.length === 0 && (
            <p className="pt-6 text-center text-[13px] text-faint">
              {completed.length > 0 ? "All done." : "Nothing here yet."}
            </p>
          )}
        </div>

        {completed.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="flex items-center gap-1 text-[12px] font-medium uppercase tracking-[0.08em] text-faint transition-colors hover:text-muted"
                onClick={() => setShowCompleted((v) => !v)}
              >
                <ChevronRight
                  size={12}
                  strokeWidth={2}
                  className={cx(
                    "transition-transform duration-150",
                    showCompleted && "rotate-90",
                  )}
                />
                Completed · {completed.length}
              </button>
              {showCompleted && (
                <button
                  type="button"
                  className="text-[12px] text-faint underline-offset-2 transition-colors hover:text-muted hover:underline"
                  onClick={() => useTodos.getState().clearCompleted()}
                >
                  Clear
                </button>
              )}
            </div>
            {showCompleted && (
              <div className="mt-2">
                {completed.map((todo) => (
                  <TodoRow key={todo.id} todo={todo} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TodoRow({ todo }: { todo: Todo }) {
  const toggle = useTodos((s) => s.toggle);
  const remove = useTodos((s) => s.remove);
  const updateText = useTodos((s) => s.updateText);
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
      className="group flex items-center gap-2.5 rounded-md px-1 py-[7px] transition-colors hover:bg-hover"
    >
      <button
        type="button"
        aria-label={todo.done ? "Mark as open" : "Mark as done"}
        onClick={() => toggle(todo.id)}
        className={cx(
          "relative grid h-[17px] w-[17px] shrink-0 place-items-center rounded-[5px] border-[1.5px] transition-colors duration-100",
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
            "min-w-0 flex-1 select-none truncate text-[14px] transition-colors duration-150",
            todo.done && "text-faint line-through decoration-faint",
          )}
          onDoubleClick={() => !todo.done && setEditing(true)}
        >
          {todo.text}
        </span>
      )}

      <button
        type="button"
        aria-label="Delete task"
        onClick={() => remove(todo.id)}
        className="grid h-5 w-5 shrink-0 place-items-center rounded text-faint opacity-0 transition-opacity duration-100 hover:text-ink group-hover:opacity-100"
      >
        <X size={13} strokeWidth={2} />
      </button>
    </motion.div>
  );
}
