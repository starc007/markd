import { EditorContent, useEditor } from "@tiptap/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ipc } from "@/lib/ipc";
import { cx, debounce, noteTitle } from "@/lib/utils";
import { useUi } from "@/stores/ui";
import { useVault } from "@/stores/vault";
import { createExtensions } from "./extensions";
import { insertImageFile } from "./insertImage";
import { SelectionMenu } from "./SelectionMenu";
import { SlashMenu, type SlashMenuState } from "./SlashMenu";

export function NoteEditor({ rel }: { rel: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ipc
      .readNote(rel)
      .then((text) => {
        if (!cancelled) setContent(text);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, [rel]);

  if (missing) {
    return (
      <div className="flex h-full items-center justify-center pb-24">
        <p className="text-[14px] text-faint">This note no longer exists.</p>
      </div>
    );
  }
  if (content === null) return null;

  return <LoadedEditor rel={rel} initialContent={content} />;
}

function LoadedEditor({
  rel,
  initialContent,
}: {
  rel: string;
  initialContent: string;
}) {
  const vaultRoot = useVault((s) => s.root);
  const renameEntry = useVault((s) => s.renameEntry);
  const setSaveState = useUi((s) => s.setSaveState);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [words, setWords] = useState(() => countWords(initialContent));

  const lastSaved = useRef(initialContent);
  const pending = useRef<string | null>(null);

  const persist = useCallback(
    async (markdown: string) => {
      pending.current = null;
      try {
        await ipc.writeNote(rel, markdown);
        lastSaved.current = markdown;
        setSaveState("idle");
        toast.dismiss(`save-${rel}`);
      } catch (err) {
        setSaveState("error");
        toast.error("Note could not be saved", {
          id: `save-${rel}`,
          description: err instanceof Error ? err.message : String(err),
          duration: Infinity,
        });
      }
    },
    [rel, setSaveState],
  );

  const debouncedPersist = useMemo(() => debounce(persist, 500), [persist]);

  const extensions = useMemo(() => createExtensions(vaultRoot), [vaultRoot]);

  const updateSlashMenu = useCallback((editor: NonNullable<EditorInstance>) => {
    const { selection } = editor.state;
    if (!selection.empty) {
      setSlashMenu(null);
      return;
    }
    const position = selection.from;
    const resolved = editor.state.doc.resolve(position);
    const textBefore = resolved.parent.textBetween(
      0,
      resolved.parentOffset,
      undefined,
      "￼",
    );
    const match = /(?:^|\s)\/([a-z0-9 ]*)$/i.exec(textBefore);
    if (!match) {
      setSlashMenu(null);
      return;
    }
    const slashIndex = textBefore.lastIndexOf("/");
    const from = position - (textBefore.length - slashIndex);
    const coords = editor.view.coordsAtPos(position);
    const menuHeight = 272;
    const below = window.innerHeight - coords.bottom > menuHeight + 16;
    setSlashMenu({
      query: match[1] ?? "",
      range: { from, to: position },
      position: {
        left: Math.max(12, Math.min(coords.left, window.innerWidth - 220)),
        top: below
          ? coords.bottom + 6
          : Math.max(12, coords.top - menuHeight - 6),
      },
      side: below ? "bottom" : "top",
    });
  }, []);

  const editor = useEditor({
    content: initialContent,
    contentType: "markdown",
    extensions,
    autofocus: initialContent.length === 0 ? "start" : false,
    editorProps: {
      attributes: {
        class: "prose-note",
        autoCapitalize: "off",
        autoCorrect: "off",
        spellCheck: "false",
        "data-gramm": "false",
      },
      handlePaste(view, event) {
        const image = Array.from(event.clipboardData?.files ?? []).find((f) =>
          f.type.startsWith("image/"),
        );
        if (image && editor) {
          event.preventDefault();
          insertImageFile({
            editor,
            file: image,
            range: {
              from: view.state.selection.from,
              to: view.state.selection.to,
            },
            vaultRoot,
          });
          return true;
        }
        return false;
      },
      handleDrop(view, event) {
        const image = Array.from(event.dataTransfer?.files ?? []).find((f) =>
          f.type.startsWith("image/"),
        );
        if (!image || !editor) return false;
        event.preventDefault();
        const coords = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        const position = coords?.pos ?? view.state.selection.from;
        insertImageFile({
          editor,
          file: image,
          range: { from: position, to: position },
          vaultRoot,
        });
        return true;
      },
      handleClick(_view, _position, event) {
        const link = (event.target as HTMLElement | null)?.closest("a");
        const href = link?.getAttribute("href");
        if (href && /^https?:\/\//i.test(href)) {
          event.preventDefault();
          openUrl(href);
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      const markdown = editor.getMarkdown();
      pending.current = markdown;
      setSaveState("saving");
      debouncedPersist(markdown);
      setWords(countWords(markdown));
      updateSlashMenu(editor);
    },
    onSelectionUpdate({ editor }) {
      updateSlashMenu(editor);
    },
  });

  // Flush unsaved changes when the note (or app view) goes away.
  useEffect(() => {
    return () => {
      debouncedPersist.cancel();
      if (pending.current !== null) persist(pending.current);
    };
  }, [debouncedPersist, persist]);

  // If the file changed on disk while we were away and the editor is clean,
  // reload it silently. Dirty editor wins.
  useEffect(() => {
    const onFocus = async () => {
      if (!editor || pending.current !== null) return;
      try {
        const disk = await ipc.readNote(rel);
        if (disk !== lastSaved.current) {
          lastSaved.current = disk;
          editor.commands.setContent(disk, { contentType: "markdown" });
          setWords(countWords(disk));
        }
      } catch {
        // note may have been deleted externally; tree refresh handles it
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [editor, rel]);

  const flushThen = (action: () => void) => {
    debouncedPersist.cancel();
    const flush =
      pending.current !== null ? persist(pending.current) : Promise.resolve();
    flush.then(action);
  };

  return (
    <div className="page-scroll">
      <div className="mx-auto w-full max-w-[720px] px-10 pt-6">
        <TitleInput
          key={rel}
          title={noteTitle(rel)}
          onRename={(name) => flushThen(() => renameEntry(rel, name))}
        />
        <EditorContent editor={editor} />
        {editor && <SelectionMenu editor={editor} />}
        <SlashMenu
          editor={editor}
          menu={slashMenu}
          onClose={() => setSlashMenu(null)}
        />
      </div>
      <div
        className={cx(
          "pointer-events-none fixed bottom-3 right-4 text-[11px] tabular-nums text-faint transition-opacity duration-300",
          words === 0 && "opacity-0",
        )}
      >
        {words} {words === 1 ? "word" : "words"}
      </div>
    </div>
  );
}

type EditorInstance = ReturnType<typeof useEditor>;

function TitleInput({
  title,
  onRename,
}: {
  title: string;
  onRename: (name: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const submit = () => {
    const value = ref.current?.value.trim();
    if (value && value !== title) onRename(value);
    else if (ref.current) ref.current.value = title;
  };

  return (
    <input
      ref={ref}
      defaultValue={title}
      placeholder="Untitled"
      className="w-full bg-transparent text-[30px] font-[680] tracking-[-0.025em] text-ink outline-none placeholder:text-faint"
      onBlur={submit}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === "Escape") {
          event.preventDefault();
          if (event.key === "Escape" && ref.current) {
            ref.current.value = title;
          }
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function countWords(markdown: string) {
  const text = markdown.trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}
