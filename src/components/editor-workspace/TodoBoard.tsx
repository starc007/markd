import {
  ArrowUpRight01Icon,
  CheckmarkSquare02Icon,
  Delete02Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useState } from "react";
import {
  AnimatedTabs,
  EmptyState,
  cx,
  type AnimatedTabItem,
} from "@/components/ui";
import type { NoteRecord } from "@/lib/types";
import { Board } from "./Board";

export interface TodoListItem {
  done: boolean;
  line: number;
  note: NoteRecord;
  text: string;
}

export function TodoBoard({
  todos,
  onDelete,
  onOpenNote,
  onToggle,
}: {
  todos: TodoListItem[];
  onDelete: (noteId: string, line: number) => Promise<void>;
  onOpenNote: (id: string) => Promise<void>;
  onToggle: (noteId: string, line: number, done: boolean) => Promise<void>;
}) {
  const [activeStatus, setActiveStatus] = useState("open");
  const openTodos = todos.filter((todo) => !todo.done).length;
  const doneTodos = todos.length - openTodos;
  const statusTabs = useMemo<AnimatedTabItem[]>(
    () => [
      { id: "open", label: "Open", count: openTodos },
      { id: "all", label: "All", count: todos.length },
      { id: "done", label: "Done", count: doneTodos },
    ],
    [doneTodos, openTodos, todos.length],
  );
  const visibleTodos = todos.filter((todo) => {
    return (
      activeStatus === "all" ||
      (activeStatus === "open" && !todo.done) ||
      (activeStatus === "done" && todo.done)
    );
  });

  useEffect(() => {
    if (activeStatus === "open" && openTodos === 0 && todos.length > 0) {
      setActiveStatus("all");
    }
  }, [activeStatus, openTodos, todos.length]);

  return (
    <Board
      title="Tasks"
      icon={Task01Icon}
      description="Every Markdown checkbox across your workspace, grouped into a clean task inbox."
      meta={
        <div className="flex items-center gap-1.5 rounded-full border border-line bg-panel-soft px-2.5 py-1 text-xs font-medium text-muted dark:border-line-dark dark:bg-panel-soft-dark dark:text-muted-dark">
          <span>{openTodos} open</span>
          <span className="text-line dark:text-line-dark">/</span>
          <span>{doneTodos} done</span>
        </div>
      }
    >
      {todos.length === 0 ? (
        <EmptyState
          icon={CheckmarkSquare02Icon}
          title="No tasks yet"
          description="Add a task list in any note and it will appear here automatically."
        />
      ) : (
        <div className="grid gap-3">
          <AnimatedTabs
            items={statusTabs}
            value={activeStatus}
            onChange={setActiveStatus}
          />
          <div className="overflow-hidden rounded-2xl bg-panel ring-1 ring-line-soft/70 dark:bg-panel-dark dark:ring-line-soft-dark/70">
            {visibleTodos.map((todo) => (
              <div
                key={`${todo.note.id}-${todo.line}`}
                className={cx(
                  "group flex items-center gap-3 border-b border-line-soft/60 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-hover dark:border-line-soft-dark/60 dark:hover:bg-hover-dark",
                  todo.done && "bg-panel-soft/35 dark:bg-panel-soft-dark/25",
                )}
              >
                <button
                  aria-label={todo.done ? "Mark task open" : "Mark task done"}
                  className="relative grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-transform duration-150 hover:scale-105"
                  onClick={() => onToggle(todo.note.id, todo.line, !todo.done)}
                  type="button"
                >
                  <input
                    type="checkbox"
                    checked={todo.done}
                    readOnly
                    className="peer absolute inset-0 h-7 w-7 cursor-pointer opacity-0"
                  />
                  <span className="grid h-5 w-5 place-items-center rounded-[7px] border border-line bg-panel transition-[background-color,border-color,transform] duration-150 peer-checked:border-ink peer-checked:bg-ink dark:border-line-dark dark:bg-panel-dark dark:peer-checked:border-ink-dark dark:peer-checked:bg-ink-dark">
                    <span
                      className={cx(
                        "h-2.5 w-1.5 translate-y-[-1px] rotate-45 border-b-2 border-r-2 border-panel opacity-0 transition-opacity duration-150 dark:border-panel-dark",
                        todo.done && "opacity-100",
                      )}
                    />
                  </span>
                </button>
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onOpenNote(todo.note.id)}
                  type="button"
                >
                  <span
                    className={cx(
                      "block min-w-0 truncate text-sm text-ink transition-colors duration-200 dark:text-ink-dark",
                      todo.done &&
                        "text-muted line-through decoration-line/80 dark:text-muted-dark",
                    )}
                  >
                    {todo.text}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted dark:text-muted-dark">
                    Line {todo.line + 1}
                  </span>
                </button>
                <button
                  className="inline-flex max-w-[220px] shrink-0 items-center gap-1 rounded-full bg-panel-soft px-2 py-0.5 text-xs font-medium text-muted transition-colors hover:text-ink dark:bg-panel-soft-dark dark:text-muted-dark dark:hover:text-ink-dark"
                  onClick={() => onOpenNote(todo.note.id)}
                  type="button"
                >
                  <HugeiconsIcon icon={Task01Icon} size={12} color="currentColor" />
                  <span className="truncate">{todo.note.title}</span>
                  <HugeiconsIcon
                    icon={ArrowUpRight01Icon}
                    size={11}
                    color="currentColor"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </button>
                <button
                  aria-label="Delete task"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted opacity-0 transition-colors hover:bg-hover hover:text-ink group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-line dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark dark:focus-visible:ring-focus-line-dark"
                  onClick={() => onDelete(todo.note.id, todo.line)}
                  type="button"
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    size={14}
                    color="currentColor"
                  />
                </button>
              </div>
            ))}
            {visibleTodos.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted dark:text-muted-dark">
                No tasks match this filter.
              </div>
            )}
          </div>
        </div>
      )}
    </Board>
  );
}
