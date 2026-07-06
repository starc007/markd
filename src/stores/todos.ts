import { create } from "zustand";
import { toast } from "sonner";
import { ipc } from "@/lib/ipc";
import type { Todo } from "@/lib/types";

interface TodosState {
  todos: Todo[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (text: string) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  updateText: (id: string, text: string) => Promise<void>;
  setTags: (id: string, tags: string[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
}

const oops = (err: unknown) =>
  toast.error(err instanceof Error ? err.message : String(err));

export const useTodos = create<TodosState>((set, get) => ({
  todos: [],
  loaded: false,

  load: async () => {
    try {
      set({ todos: await ipc.todosList(), loaded: true });
    } catch (err) {
      oops(err);
    }
  },

  add: async (text) => {
    try {
      const todo = await ipc.todoAdd(text);
      set({ todos: [todo, ...get().todos] });
    } catch (err) {
      oops(err);
    }
  },

  toggle: async (id) => {
    // optimistic — checkbox must feel instant
    set({
      todos: get().todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    });
    try {
      const updated = await ipc.todoToggle(id);
      set({ todos: get().todos.map((t) => (t.id === id ? updated : t)) });
    } catch (err) {
      oops(err);
      get().load();
    }
  },

  updateText: async (id, text) => {
    try {
      const updated = await ipc.todoUpdate(id, text);
      set({ todos: get().todos.map((t) => (t.id === id ? updated : t)) });
    } catch (err) {
      oops(err);
    }
  },

  setTags: async (id, tags) => {
    try {
      const updated = await ipc.todoSetTags(id, tags);
      set({ todos: get().todos.map((t) => (t.id === id ? updated : t)) });
    } catch (err) {
      oops(err);
    }
  },

  remove: async (id) => {
    set({ todos: get().todos.filter((t) => t.id !== id) });
    try {
      await ipc.todoDelete(id);
    } catch (err) {
      oops(err);
      get().load();
    }
  },

  clearCompleted: async () => {
    try {
      set({ todos: await ipc.todosClearCompleted() });
    } catch (err) {
      oops(err);
    }
  },
}));
