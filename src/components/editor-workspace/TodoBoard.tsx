import {
  ArrowUpRight01Icon,
  CheckmarkSquare02Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { EmptyState, cx } from "@/components/ui";
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
  onOpenNote,
  onToggle,
}: {
  todos: TodoListItem[];
  onOpenNote: (id: string) => Promise<void>;
  onToggle: (noteId: string, line: number, done: boolean) => Promise<void>;
}) {
  const openTodos = todos.filter((todo) => !todo.done).length;
  const doneTodos = todos.length - openTodos;

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
        <div className="overflow-hidden rounded-2xl border border-line-soft bg-panel dark:border-line-soft-dark dark:bg-panel-dark">
        {todos.map((todo) => (
          <div
            key={`${todo.note.id}-${todo.line}`}
            className="group flex items-center gap-3 border-b border-line-soft/80 px-3 py-2.5 last:border-b-0 hover:bg-hover dark:border-line-soft-dark/80 dark:hover:bg-hover-dark"
          >
            <button
              aria-label={todo.done ? "Mark task open" : "Mark task done"}
              className="relative grid h-5 w-5 shrink-0 place-items-center"
              onClick={() => onToggle(todo.note.id, todo.line, !todo.done)}
              type="button"
            >
              <input
                type="checkbox"
                checked={todo.done}
                readOnly
                className="peer absolute inset-0 h-5 w-5 cursor-default opacity-0"
              />
              <span className="grid h-4 w-4 place-items-center rounded-[5px] border border-line bg-panel transition-colors peer-checked:border-ink peer-checked:bg-ink dark:border-line-dark dark:bg-panel-dark dark:peer-checked:border-ink-dark dark:peer-checked:bg-ink-dark">
                {todo.done && (
                  <span className="h-2 w-1 rotate-45 border-b-2 border-r-2 border-panel dark:border-panel-dark" />
                )}
              </span>
            </button>
            <button
              className="min-w-0 flex-1 text-left"
              onClick={() => onOpenNote(todo.note.id)}
              type="button"
            >
              <span
              className={cx(
                "min-w-0 flex-1 truncate text-sm text-ink dark:text-ink-dark",
                todo.done && "text-muted line-through dark:text-muted-dark",
              )}
              >
                {todo.text}
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
          </div>
        ))}
        </div>
      )}
    </Board>
  );
}
