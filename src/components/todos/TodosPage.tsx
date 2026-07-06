import { Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Todo } from "@/lib/types";
import { Tooltip } from "@/components/ui/Tooltip";
import { cx } from "@/lib/utils";
import { useTodos } from "@/stores/todos";

export function TodosPage() {
  const { todos, loaded, load, add } = useTodos();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [load]);

  const completedCount = todos.filter((t) => t.done).length;

  const submit = () => {
    const value = inputRef.current?.value.trim();
    if (!value) return;
    add(value);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="page-scroll">
      <div className="mx-auto w-full max-w-[560px] px-8 pb-24 pt-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[30px] font-[680] tracking-[-0.025em]">Todos</h1>
          {completedCount > 0 && (
            <button
              type="button"
              className="text-[12px] text-faint underline-offset-2 transition-colors hover:text-muted hover:underline"
              onClick={() => useTodos.getState().clearCompleted()}
            >
              Clear completed · {completedCount}
            </button>
          )}
        </div>

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
            {todos.map((todo) => (
              <TodoRow key={todo.id} todo={todo} />
            ))}
          </AnimatePresence>
          {loaded && todos.length === 0 && (
            <p className="pt-6 text-center text-[13px] text-faint">
              Nothing here yet.
            </p>
          )}
        </div>
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
      className="group flex items-center gap-2.5 rounded-md px-1 py-[7px]"
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
            "min-w-0 flex-1 cursor-pointer select-none truncate text-[14px] transition-colors duration-150",
            todo.done && "text-faint line-through decoration-faint",
          )}
          onClick={() => toggle(todo.id)}
          onDoubleClick={() => !todo.done && setEditing(true)}
        >
          {todo.text}
        </span>
      )}

      <Tooltip label="Delete" side="left">
        <button
          type="button"
          onClick={() => remove(todo.id)}
          className="grid h-5 w-5 shrink-0 place-items-center rounded text-faint opacity-0 transition-opacity duration-100 hover:text-ink group-hover:opacity-100"
        >
          <X size={13} strokeWidth={2} />
        </button>
      </Tooltip>
    </motion.div>
  );
}
