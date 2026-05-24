import { useEffect, useRef, useState } from "react";
import { extractTodos } from "@/lib/format";
import { useWorkspaceStore } from "@/stores/workspace";
import { BookmarkBoard } from "./BookmarkBoard";
import { EmptyEditorState } from "./EmptyEditorState";
import { MarkdownEditor } from "./MarkdownEditor";
import { SettingsBoard } from "./SettingsBoard";
import { StickyBoard } from "./StickyBoard";
import { TodoBoard } from "./TodoBoard";

export function EditorPane() {
  const view = useWorkspaceStore((state) => state.view);
  const activeNote = useWorkspaceStore((state) => state.activeNote);
  const manifest = useWorkspaceStore((state) => state.manifest);
  const saveActiveNote = useWorkspaceStore((state) => state.saveActiveNote);
  const createNote = useWorkspaceStore((state) => state.createNote);
  const saveSticky = useWorkspaceStore((state) => state.saveSticky);
  const saveBookmark = useWorkspaceStore((state) => state.saveBookmark);
  const [content, setContent] = useState(activeNote?.content ?? "");
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

  if (view === "stickies") {
    return <StickyBoard stickies={manifest?.stickies ?? []} onSave={saveSticky} />;
  }

  if (view === "bookmarks") {
    return <BookmarkBoard bookmarks={manifest?.bookmarks ?? []} onSave={saveBookmark} />;
  }

  if (view === "todos") {
    const todos = (manifest?.notes ?? []).flatMap((note) => {
      if (activeNote?.meta.id !== note.id) return [];
      return extractTodos(content).map((todo) => ({ ...todo, note }));
    });

    return <TodoBoard todos={todos} />;
  }

  if (view === "settings") {
    return <SettingsBoard />;
  }

  if (!activeNote) {
    return <EmptyEditorState onCreateNote={createNote} />;
  }

  return (
    <MarkdownEditor
      content={content}
      onChange={setContent}
      onSave={() => saveActiveNote(content)}
    />
  );
}
