import { useEffect, useRef, useState } from "react";
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
  const openNote = useWorkspaceStore((state) => state.openNote);
  const saveActiveNote = useWorkspaceStore((state) => state.saveActiveNote);
  const createLinkedNote = useWorkspaceStore((state) => state.createLinkedNote);
  const createNote = useWorkspaceStore((state) => state.createNote);
  const saveSticky = useWorkspaceStore((state) => state.saveSticky);
  const deleteSticky = useWorkspaceStore((state) => state.deleteSticky);
  const saveBookmark = useWorkspaceStore((state) => state.saveBookmark);
  const deleteBookmark = useWorkspaceStore((state) => state.deleteBookmark);
  const toggleTodo = useWorkspaceStore((state) => state.toggleTodo);
  const [content, setContent] = useState(activeNote?.content ?? "");
  const [todoItems, setTodoItems] = useState<
    Array<ReturnType<typeof extractTodos>[number] & { note: NoteRecord }>
  >([]);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setContent(activeNote?.content ?? "");
  }, [activeNote?.meta.id, activeNote?.content]);

  useEffect(() => {
    if (!activeNote || content === activeNote.content) return;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      saveActiveNote(content);
    }, 240);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [activeNote, content, saveActiveNote]);

  useEffect(() => {
    if (view !== "todos" || !manifest) return;

    let cancelled = false;
    Promise.all(
      manifest.notes.map(async (note) => {
        if (activeNote?.meta.id === note.id) {
          return { note, content };
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
  }, [activeNote?.meta.id, content, manifest, view]);

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
      content={content}
      notes={manifest?.notes ?? []}
      title={activeNote.meta.title}
      onChange={setContent}
      onCreatePage={createLinkedNote}
      onOpenPage={openNote}
      onSave={() => saveActiveNote(content)}
    />
  );
}
