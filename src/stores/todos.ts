import { create } from "zustand";
import { toast } from "sonner";
import { ipc } from "@/lib/ipc";
import type { Todo } from "@/lib/types";

interface TodosState {
  todos: Todo[];
  tagRegistry: string[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (text: string, tags?: string[]) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  updateText: (id: string, text: string) => Promise<void>;
  setTags: (id: string, tags: string[]) => Promise<void>;
  createTag: (name: string) => Promise<void>;
  deleteTag: (name: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
}

const oops = (err: unknown) =>
  toast.error(err instanceof Error ? err.message : String(err));

export const useTodos = create<TodosState>((set, get) => ({
  todos: [],
  tagRegistry: [],
  loaded: false,

  load: async () => {
    try {
      const [todos, tagRegistry] = await Promise.all([
        ipc.todosList(),
        ipc.todoTagsList(),
      ]);
      set({ todos, tagRegistry, loaded: true });
    } catch (err) {
      oops(err);
    }
  },

  add: async (text, tags) => {
    try {
      let todo = await ipc.todoAdd(text);
      if (tags && tags.length) {
        todo = await ipc.todoSetTags(todo.id, tags);
      }
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
      const registry = new Set(get().tagRegistry);
      updated.tags.forEach((t) => registry.add(t));
      set({
        todos: get().todos.map((t) => (t.id === id ? updated : t)),
        tagRegistry: [...registry],
      });
    } catch (err) {
      oops(err);
    }
  },

  createTag: async (name) => {
    try {
      set({ tagRegistry: await ipc.todoTagCreate(name) });
    } catch (err) {
      oops(err);
    }
  },

  deleteTag: async (name) => {
    try {
      const tagRegistry = await ipc.todoTagDelete(name);
      set({
        tagRegistry,
        todos: get().todos.map((t) => ({
          ...t,
          tags: t.tags.filter((tag) => tag !== name),
        })),
      });
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
