import { useCallback, useEffect, useRef, useState } from "react";
import { extractTodos } from "@/lib/format";
import type { NoteRecord } from "@/lib/types";
import * as api from "@/lib/workspace-api";
import { useWorkspaceStore } from "@/stores/workspace";
import { BookmarkBoard } from "./BookmarkBoard";
import { EmptyEditorState } from "./EmptyEditorState";
import { RichNoteEditor } from "./rich-editor";
import { SettingsBoard } from "./SettingsBoard";
import { StickyBoard } from "./StickyBoard";
import { TodoBoard } from "./TodoBoard";

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
  const contentRef = useRef(activeNote?.content ?? "");
  const timeoutRef = useRef<number | null>(null);
  const titleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    contentRef.current = activeNote?.content ?? "";
    setTitle(activeNote?.meta.title ?? "");
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (titleTimeoutRef.current) window.clearTimeout(titleTimeoutRef.current);
  }, [activeNote?.meta.id]);

  useEffect(() => {
    setTitle(activeNote?.meta.title ?? "");
  }, [activeNote?.meta.id, activeNote?.meta.title]);

  const handleContentChange = useCallback(
    (nextContent: string) => {
      contentRef.current = nextContent;
      if (!activeNote || nextContent === activeNote.content) return;

      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        saveActiveNote(contentRef.current);
      }, 360);
    },
    [activeNote, saveActiveNote],
  );

  const handleImmediateSave = useCallback(() => {
    if (!activeNote || contentRef.current === activeNote.content) return;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    saveActiveNote(contentRef.current);
  }, [activeNote, saveActiveNote]);

  useEffect(() => {
    if (!activeNote || title === activeNote.meta.title) return;
    if (titleTimeoutRef.current) window.clearTimeout(titleTimeoutRef.current);
    titleTimeoutRef.current = window.setTimeout(() => {
      saveActiveTitle(title, contentRef.current);
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
        if (activeNote?.meta.id === note.id) {
          return { note, content: contentRef.current };
        }
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
        onDelete={deleteTodo}
        onOpenNote={openNote}
        onToggle={toggleTodo}
      />
    );
  }

  if (view === "settings") {
    return <SettingsBoard />;
  }

  if (!activeNote) {
    return <EmptyEditorState onCreateNote={createNote} />;
  }

  return (
    <RichNoteEditor
      activeNoteId={activeNote.meta.id}
      content={activeNote.content}
      notes={manifest?.notes ?? []}
      title={title}
      workspaceRoot={rootPath}
      shouldSelectTitle={noteIdPendingTitleSelection === activeNote.meta.id}
      onChange={handleContentChange}
      onCreatePage={createLinkedNote}
      onOpenPage={openNote}
      onSave={handleImmediateSave}
      onTitleSelected={clearPendingTitleSelection}
      onTitleChange={setTitle}
      onTitleSave={() => saveActiveTitle(title, contentRef.current)}
    />
  );
}
