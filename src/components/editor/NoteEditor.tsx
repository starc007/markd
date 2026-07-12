import { EditorContent, useEditor } from "@tiptap/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ipc } from "@/lib/ipc";
import {
  joinFrontmatter,
  parseFrontmatter,
  splitFrontmatter,
  type Property,
} from "@/lib/frontmatter";
import { hrefToRel, relToHref, wikiToMarkdown } from "@/lib/noteLinks";
import { flattenNotes } from "@/lib/tree";
import { cx, debounce, noteTitle } from "@/lib/utils";
import { useTabs } from "@/stores/tabs";
import { useUi } from "@/stores/ui";
import { useVault } from "@/stores/vault";
import { createExtensions } from "./extensions";
import { insertImageFile } from "./insertImage";
import { NoteLinkPicker, type LinkPickerState } from "./NoteLinkPicker";
import { NoteProperties } from "./NoteProperties";
import { SelectionMenu } from "./SelectionMenu";
import { SlashMenu, type SlashMenuState } from "./SlashMenu";

/**
 * One live Tiptap instance per mounted editor. Tab panes keep an instance per
 * open note (hidden via display:none when inactive) so switching tabs is a
 * pure CSS toggle — no parse, no remount, cursor/undo/scroll preserved. The
 * per-mount work (schema build, plugin setup, view creation) is paid once per
 * tab open, never on switch.
 *
 * `rel` can also change on a mounted instance (content is swapped via
 * setContent), so every rel-dependent bit of logic reads from `relRef` rather
 * than a closure captured at editor creation.
 *
 * `active` gates the singleton concerns (fixed word counter, focus-reload,
 * overlay menus) so hidden panes stay completely inert.
 */
export const NoteEditor = memo(function NoteEditor({
  rel,
  active = true,
}: {
  rel: string;
  active?: boolean;
}) {
  const vaultRoot = useVault((s) => s.root);
  const renameEntry = useVault((s) => s.renameEntry);
  const setSaveState = useUi((s) => s.setSaveState);
  const markdownSource = useUi((s) => s.markdownSource);

  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [linkPicker, setLinkPicker] = useState<LinkPickerState | null>(null);
  const [words, setWords] = useState(0);
  const [missing, setMissing] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rawText, setRawText] = useState("");

  const relRef = useRef(rel);
  // Frontmatter of the loaded note, kept out of the editor and re-attached on
  // save so the file's metadata survives round-trips.
  const frontmatter = useRef("");
  const activeRef = useRef(active);
  activeRef.current = active;
  const scrollRef = useRef<HTMLDivElement>(null);
  // Tracked continuously — reading scrollTop after display:none flips is too
  // late (layout is gone), so the pane restores from this on re-activation.
  const savedScroll = useRef(0);
  const lastSaved = useRef("");
  const pending = useRef<string | null>(null);
  const loadedRel = useRef<string | null>(null);
  // True only while we're programmatically replacing the document, so the
  // resulting onUpdate doesn't mark the fresh content as an unsaved edit.
  const swapping = useRef(false);

  const persist = useCallback(
    async (markdown: string, targetRel: string) => {
      if (relRef.current === targetRel) pending.current = null;
      // Re-attach the note's frontmatter (captured now, before any await, so a
      // concurrent note switch can't swap it out mid-save).
      const fullText = joinFrontmatter(frontmatter.current, markdown);
      try {
        await ipc.writeNote(targetRel, fullText);
        if (relRef.current === targetRel) {
          lastSaved.current = fullText;
          setSaveState("idle");
        }
        toast.dismiss(`save-${targetRel}`);
      } catch (err) {
        setSaveState("error");
        toast.error("Note could not be saved", {
          id: `save-${targetRel}`,
          description: err instanceof Error ? err.message : String(err),
          duration: Infinity,
        });
      }
    },
    [setSaveState],
  );

  const debouncedPersist = useMemo(
    () => debounce((markdown: string) => persist(markdown, relRef.current), 500),
    [persist],
  );

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

  const editor = useEditor(
    {
      content: "",
      contentType: "markdown",
      extensions,
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
        // Link clicks are handled by a capture-phase listener on the pane (see
        // the effect below) so the anchor's native navigation is stopped before
        // anything — including the webview — can act on it.
      },
      onUpdate({ editor }) {
        if (swapping.current) return;
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
    },
    [extensions],
  );

  // Load the note (and swap in its content) whenever `rel` changes. The old
  // note's pending edit is flushed to *its* path first, before we switch.
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;

    const prevRel = loadedRel.current;
    debouncedPersist.cancel();
    if (prevRel && prevRel !== rel && pending.current !== null) {
      persist(pending.current, prevRel);
    }
    pending.current = null;
    relRef.current = rel;
    setMissing(false);
    setSlashMenu(null);

    ipc
      .readNote(rel)
      .then((text) => {
        if (cancelled) return;
        lastSaved.current = text;
        loadedRel.current = rel;
        // Split off frontmatter (kept for save), then render any `[[wiki]]`
        // links in the body as real page links. lastSaved keeps the raw disk
        // text; rewrites only reach the file if the user edits the note.
        const { frontmatter: fm, body } = splitFrontmatter(text);
        frontmatter.current = fm;
        setRawText(text);
        setProperties(parseFrontmatter(fm));
        const notes = flattenNotes(useVault.getState().tree);
        swapping.current = true;
        editor.commands.setContent(wikiToMarkdown(body, notes), {
          contentType: "markdown",
        });
        swapping.current = false;
        setWords(countWords(body));
        // A freshly loaded note starts at the top.
        savedScroll.current = 0;
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
        const titleFocus = useTabs.getState().titleFocusReq;
        if (
          body.length === 0 &&
          activeRef.current &&
          titleFocus?.rel !== rel
        ) {
          editor.commands.focus("start");
        }
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });

    return () => {
      cancelled = true;
    };
  }, [editor, rel, persist, debouncedPersist]);

  const previousSource = useRef(markdownSource);
  useEffect(() => {
    if (!editor || previousSource.current === markdownSource) return;
    previousSource.current = markdownSource;

    if (markdownSource) {
      setRawText(joinFrontmatter(frontmatter.current, editor.getMarkdown()));
      return;
    }

    const { frontmatter: fm, body } = splitFrontmatter(rawText);
    frontmatter.current = fm;
    setProperties(parseFrontmatter(fm));
    const notes = flattenNotes(useVault.getState().tree);
    swapping.current = true;
    editor.commands.setContent(wikiToMarkdown(body, notes), {
      contentType: "markdown",
    });
    swapping.current = false;
  }, [editor, markdownSource, rawText]);

  // Flush any unsaved edit when the editor unmounts (tab closed / view gone).
  useEffect(() => {
    return () => {
      debouncedPersist.cancel();
      if (pending.current !== null) persist(pending.current, relRef.current);
    };
  }, [debouncedPersist, persist]);

  // If the file changed on disk while we were away and the editor is clean,
  // reload it silently. Dirty editor wins. Only the active pane checks —
  // hidden tabs catch up in the activation effect below.
  const reloadIfChanged = useCallback(async () => {
    if (!editor || pending.current !== null) return;
    const cur = relRef.current;
    try {
      const disk = await ipc.readNote(cur);
      if (cur !== relRef.current || pending.current !== null) return;
      if (disk !== lastSaved.current) {
        lastSaved.current = disk;
        setRawText(disk);
        const { frontmatter: fm, body } = splitFrontmatter(disk);
        frontmatter.current = fm;
        setProperties(parseFrontmatter(fm));
        const notes = flattenNotes(useVault.getState().tree);
        swapping.current = true;
        editor.commands.setContent(wikiToMarkdown(body, notes), {
          contentType: "markdown",
        });
        swapping.current = false;
        setWords(countWords(body));
      }
    } catch {
      // note may have been deleted externally; tree refresh handles it
    }
  }, [editor]);

  useEffect(() => {
    const onFocus = () => {
      if (activeRef.current) reloadIfChanged();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [reloadIfChanged]);

  // On tab activation: restore the pane's scroll offset (display:none wiped
  // the layout) and pick up any external edit that landed while hidden.
  useEffect(() => {
    if (!active) return;
    if (scrollRef.current) scrollRef.current.scrollTop = savedScroll.current;
    reloadIfChanged();
  }, [active, reloadIfChanged]);

  // Handle link clicks in the capture phase, before the anchor's native
  // navigation (which the webview would otherwise turn into a browser open).
  // Scoped to this pane's DOM, so exactly one handler runs per click.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      event.preventDefault();
      event.stopPropagation();
      if (/^https?:\/\//i.test(href)) {
        openUrl(href);
        return;
      }
      const target = hrefToRel(href);
      if (target) {
        const vault = useVault.getState();
        vault.expandTo(target);
        vault.setView({ type: "note", rel: target });
        // Links point at the note as a whole — open it at the top, even if the
        // target tab was already scrolled down.
        useTabs.getState().requestScrollTop(target);
      }
    };
    root.addEventListener("click", onClick, true);
    return () => root.removeEventListener("click", onClick, true);
  }, []);

  // Honor a scroll-to-top request for this note (fired when opened via a link).
  const scrollTopReq = useTabs((s) => s.scrollTopReq);
  const titleFocusReq = useTabs((s) => s.titleFocusReq);
  useEffect(() => {
    if (!scrollTopReq || scrollTopReq.rel !== rel) return;
    savedScroll.current = 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [scrollTopReq, rel]);

  const flushThen = (action: () => void) => {
    debouncedPersist.cancel();
    const flush =
      pending.current !== null
        ? persist(pending.current, relRef.current)
        : Promise.resolve();
    flush.then(action);
  };

  useEffect(() => {
    if (!active || !editor) return;
    const handle = async (event: Event) => {
      try {
        const action = (event as CustomEvent<{ action?: string }>).detail?.action;
        const markdown = markdownSource
          ? rawText
          : joinFrontmatter(frontmatter.current, editor.getMarkdown());

        if (action === "copy") {
          await navigator.clipboard.writeText(markdown);
          toast("Markdown copied");
        } else if (action === "export") {
          const path = await ipc.exportNote(relRef.current, markdown);
          if (path) toast("Note exported", { description: path });
        } else if (action === "delete") {
          debouncedPersist.cancel();
          if (pending.current !== null) {
            await persist(pending.current, relRef.current);
          }
          await useVault.getState().deleteEntry(relRef.current);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    };
    window.addEventListener("markd:note-action", handle);
    return () => window.removeEventListener("markd:note-action", handle);
  }, [active, debouncedPersist, editor, markdownSource, persist, rawText]);

  // Insert a page link to `rel` over the slash range, as a link mark whose
  // href is the note path (serializes to `[title](rel)` markdown on save).
  const insertNoteLink = (rel: string, title: string) => {
    if (!editor || !linkPicker) return;
    editor
      .chain()
      .focus()
      .deleteRange(linkPicker.range)
      .insertContent([
        {
          type: "text",
          text: title,
          marks: [{ type: "link", attrs: { href: relToHref(rel) } }],
        },
        { type: "text", text: " " },
      ])
      .run();
    setLinkPicker(null);
  };

  return (
    <div
      ref={scrollRef}
      className="page-scroll"
      onScroll={(event) => {
        savedScroll.current = event.currentTarget.scrollTop;
      }}
    >
      <div className="mx-auto w-full max-w-[720px] px-10 pt-6">
        {missing ? (
          <p className="pt-16 text-center text-[14px] text-faint">
            This note no longer exists.
          </p>
        ) : (
          <TitleInput
            key={rel}
            title={noteTitle(rel)}
            focusNonce={
              titleFocusReq?.rel === rel ? titleFocusReq.nonce : undefined
            }
            onRename={(name) => flushThen(() => renameEntry(rel, name))}
          />
        )}
        <div className={cx(missing && "hidden")}>
          {markdownSource ? (
            <textarea
              value={rawText}
              aria-label="Markdown source"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => {
                const text = event.target.value;
                setRawText(text);
                const { frontmatter: fm, body } = splitFrontmatter(text);
                frontmatter.current = fm;
                setProperties(parseFrontmatter(fm));
                pending.current = body;
                setSaveState("saving");
                debouncedPersist(body);
                setWords(countWords(body));
              }}
              className="min-h-[calc(100vh-190px)] w-full resize-none bg-transparent pb-20 font-mono text-[13px] leading-6 text-ink outline-none placeholder:text-faint"
            />
          ) : (
            <>
              <NoteProperties properties={properties} />
              <EditorContent editor={editor} />
            </>
          )}
        </div>
        {active && editor && !markdownSource && <SelectionMenu editor={editor} />}
        {active && !markdownSource && (
          <SlashMenu
            editor={editor}
            menu={slashMenu}
            onClose={() => setSlashMenu(null)}
            onLinkToNote={(range) => {
              if (slashMenu) {
                setLinkPicker({
                  range,
                  position: slashMenu.position,
                  side: slashMenu.side,
                });
              }
              setSlashMenu(null);
            }}
          />
        )}
        {active && !markdownSource && linkPicker && (
          <NoteLinkPicker
            state={linkPicker}
            currentRel={rel}
            onPick={insertNoteLink}
            onClose={() => setLinkPicker(null)}
          />
        )}
      </div>
      {active && (
        <div
          className={cx(
            "pointer-events-none fixed bottom-3 right-4 text-[11px] tabular-nums text-faint transition-opacity duration-300",
            (words === 0 || missing) && "opacity-0",
          )}
        >
          {words} {words === 1 ? "word" : "words"}
        </div>
      )}
    </div>
  );
});

type EditorInstance = ReturnType<typeof useEditor>;

function TitleInput({
  title,
  focusNonce,
  onRename,
}: {
  title: string;
  focusNonce?: number;
  onRename: (name: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusNonce === undefined) return;
    ref.current?.focus();
    ref.current?.select();
  }, [focusNonce]);

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
