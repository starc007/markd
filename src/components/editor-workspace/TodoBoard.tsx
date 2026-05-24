import { Task01Icon } from "@hugeicons/core-free-icons";
import type { NoteRecord } from "@/lib/types";
import { Board } from "./Board";

export interface TodoListItem {
  done: boolean;
  line: number;
  note: NoteRecord;
  text: string;
}

export function TodoBoard({ todos }: { todos: TodoListItem[] }) {
  return (
    <Board title="Todos" icon={Task01Icon}>
      <div className="grid gap-2">
        {todos.length === 0 && <p>No todos in the active file yet.</p>}
        {todos.map((todo) => (
          <label
            key={`${todo.note.id}-${todo.line}`}
            className="flex items-center gap-3 rounded-[18px] border border-line p-3.5"
          >
            <input type="checkbox" checked={todo.done} readOnly />
            <span>{todo.text}</span>
            <small className="ml-auto text-muted">
              {todo.note.title}
            </small>
          </label>
        ))}
      </div>
    </Board>
  );
}
