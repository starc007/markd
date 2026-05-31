import { useCallback, useEffect, useRef, useState } from "react";
import { extractTodos } from "@/lib/format";
import type { NoteDocument, NoteRecord } from "@/lib/types";
import * as api from "@/lib/workspace-api";
import { useWorkspaceStore } from "@/stores/workspace";
import { BookmarkBoard } from "./BookmarkBoard";
import { EmptyEditorState } from "./EmptyEditorState";
import { RichNoteEditor } from "./rich-editor";
import { SettingsBoard } from "./SettingsBoard";
import { StickyBoard } from "./StickyBoard";
import { TodoBoard } from "./TodoBoard";

function reconcileTodosForNote(
  items: Array<ReturnType<typeof extractTodos>[number] & { note: NoteRecord }>,
  note: NoteDocument,
) {
  const nextTodos = extractTodos(note.content).map((todo) => ({
    ...todo,
    note: note.meta,
  }));
  const output: typeof items = [];
  let inserted = false;

  for (const item of items) {
    if (item.note.id !== note.meta.id) {
      output.push(item);
      continue;
    }

    if (!inserted) {
      output.push(...nextTodos);
      inserted = true;
    }
  }

  if (!inserted) output.push(...nextTodos);
  return output;
}

export function EditorPane() {
  const view = useWorkspaceStore((state) => state.view);
  const activeNote = useWorkspaceStore((state) => state.activeNote);
  const manifest = useWorkspaceStore((state) => state.manifest);
  const rootPath = useWorkspaceStore((state) => state.rootPath);
  const noteIdPendingTitleSelection = useWorkspaceStore(
    (state) => state.noteIdPendingTitleSelection,
  );
  const openNote = useWorkspaceStore((state) => state.openNote);
  const clearPendingTitleSelection = useWorkspaceStore(
    (state) => state.clearPendingTitleSelection,
  );
  const saveActiveNote = useWorkspaceStore((state) => state.saveActiveNote);
  const saveActiveTitle = useWorkspaceStore((state) => state.saveActiveTitle);
  const createLinkedNote = useWorkspaceStore((state) => state.createLinkedNote);
  const createNote = useWorkspaceStore((state) => state.createNote);
  const saveSticky = useWorkspaceStore((state) => state.saveSticky);
  const deleteSticky = useWorkspaceStore((state) => state.deleteSticky);
  const saveBookmark = useWorkspaceStore((state) => state.saveBookmark);
  const deleteBookmark = useWorkspaceStore((state) => state.deleteBookmark);
  const toggleTodo = useWorkspaceStore((state) => state.toggleTodo);
  const deleteTodo = useWorkspaceStore((state) => state.deleteTodo);
  const [title, setTitle] = useState(activeNote?.meta.title ?? "");
  const [todoItems, setTodoItems] = useState<
    Array<ReturnType<typeof extractTodos>[number] & { note: NoteRecord }>
  >([]);
  const [taskFocus, setTaskFocus] = useState<{
    line: number;
    noteId: string;
    text: string;
  } | null>(null);
  const contentRef = useRef(activeNote?.content ?? "");
  const timeoutRef = useRef<number | null>(null);
  const titleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const note = activeNote;
    contentRef.current = activeNote?.content ?? "";
    setTitle(activeNote?.meta.title ?? "");
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (titleTimeoutRef.current) window.clearTimeout(titleTimeoutRef.current);
    return () => {
      if (!note || contentRef.current === note.content) return;
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      saveActiveNote(contentRef.current, note.meta.id);
    };
  }, [activeNote?.meta.id, saveActiveNote]);

  useEffect(() => {
    if (view === "notes") return;
    contentRef.current = activeNote?.content ?? "";
  }, [activeNote?.content, view]);

  useEffect(() => {
    setTitle(activeNote?.meta.title ?? "");
  }, [activeNote?.meta.id, activeNote?.meta.title]);

  const handleContentChange = useCallback(
    (nextContent: string) => {
      contentRef.current = nextContent;
      if (!activeNote || nextContent === activeNote.content) return;

      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        saveActiveNote(contentRef.current, activeNote.meta.id);
      }, 360);
    },
    [activeNote, saveActiveNote],
  );

  const handleImmediateSave = useCallback(() => {
    if (!activeNote || contentRef.current === activeNote.content) return;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    saveActiveNote(contentRef.current, activeNote.meta.id);
  }, [activeNote, saveActiveNote]);

  const handleToggleTodo = useCallback(
    async (noteId: string, line: number, done: boolean) => {
      setTodoItems((items) =>
        items.map((item) =>
          item.note.id === noteId && item.line === line
            ? { ...item, done }
            : item,
        ),
      );
      const note = await toggleTodo(noteId, line, done);
      if (!note) return;
      setTodoItems((items) => reconcileTodosForNote(items, note));
    },
    [toggleTodo],
  );

  const handleDeleteTodo = useCallback(
    async (noteId: string, line: number) => {
      setTodoItems((items) =>
        items.filter((item) => item.note.id !== noteId || item.line !== line),
      );
      const note = await deleteTodo(noteId, line);
      if (!note) return;
      setTodoItems((items) => reconcileTodosForNote(items, note));
    },
    [deleteTodo],
  );

  const handleOpenTodo = useCallback(
    async (todo: ReturnType<typeof extractTodos>[number] & { note: NoteRecord }) => {
      setTaskFocus({
        line: todo.line,
        noteId: todo.note.id,
        text: todo.text,
      });
      await openNote(todo.note.id);
    },
    [openNote],
  );

  useEffect(() => {
    if (!activeNote || title === activeNote.meta.title) return;
    if (titleTimeoutRef.current) window.clearTimeout(titleTimeoutRef.current);
    titleTimeoutRef.current = window.setTimeout(() => {
      saveActiveTitle(title, contentRef.current, activeNote.meta.id);
    }, 360);
    return () => {
      if (titleTimeoutRef.current) window.clearTimeout(titleTimeoutRef.current);
    };
  }, [activeNote, saveActiveTitle, title]);

  useEffect(() => {
    if (view !== "todos" || !manifest) return;

    let cancelled = false;
    Promise.all(
      manifest.notes.map(async (note) => {
        const document = await api.getNote(note.id);
        return { note, content: document?.content ?? "" };
      }),
    ).then((documents) => {
      if (cancelled) return;
      setTodoItems(
        documents.flatMap(({ note, content }) =>
          extractTodos(content).map((todo) => ({ ...todo, note })),
        ),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [activeNote?.meta.id, manifest, view]);

  if (view === "stickies") {
    return (
      <StickyBoard
        stickies={manifest?.stickies ?? []}
        onDelete={deleteSticky}
        onSave={saveSticky}
      />
    );
  }

  if (view === "bookmarks") {
    return (
      <BookmarkBoard
        bookmarks={manifest?.bookmarks ?? []}
        onDelete={deleteBookmark}
        onSave={saveBookmark}
      />
    );
  }

  if (view === "todos") {
    return (
      <TodoBoard
        todos={todoItems}
        onDelete={handleDeleteTodo}
        onOpenTodo={handleOpenTodo}
        onToggle={handleToggleTodo}
      />
    );
  }

  if (view === "settings") {
    return <SettingsBoard />;
  }

  if (!activeNote) {
    return <EmptyEditorState onCreateNote={() => createNote()} />;
  }

  return (
    <RichNoteEditor
      activeNoteId={activeNote.meta.id}
      content={activeNote.content}
      notes={manifest?.notes ?? []}
      title={title}
      workspaceRoot={rootPath}
      shouldSelectTitle={noteIdPendingTitleSelection === activeNote.meta.id}
      taskFocus={
        taskFocus?.noteId === activeNote.meta.id
          ? { line: taskFocus.line, text: taskFocus.text }
          : null
      }
      onChange={handleContentChange}
      onCreatePage={createLinkedNote}
      onOpenPage={openNote}
      onSave={handleImmediateSave}
      onTitleSelected={clearPendingTitleSelection}
      onTitleChange={setTitle}
      onTitleSave={() =>
        saveActiveTitle(title, contentRef.current, activeNote.meta.id)
      }
    />
  );
}
