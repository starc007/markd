import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { matchesShortcut } from "@/lib/shortcuts";
import { useShortcuts } from "@/stores/shortcuts";
import { useUi } from "@/stores/ui";
import {
  findEditorMatches,
  type FindMatch,
  findPlainTextMatches,
  replaceMatches,
  replaceTextRange,
  selectEditorMatch,
  updateFindHighlights,
  wrapIndex,
} from "./noteFind";

type UseNoteFindReplaceOptions = {
  active: boolean;
  contentVersion: number;
  editor: Editor | null;
  markdownSource: boolean;
  rawText: string;
  rel: string;
  applyRawTextChange: (text: string) => void;
};

export function useNoteFindReplace({
  active,
  contentVersion,
  editor,
  markdownSource,
  rawText,
  rel,
  applyRawTextChange,
}: UseNoteFindReplaceOptions) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [replaceOpen, setReplaceOpen] = useState(false);
  const replaceOpenRef = useRef(false);
  const [activeMatch, setActiveMatch] = useState(0);
  const [sourceSelection, setSourceSelection] = useState<{
    from: number;
    to: number;
    nonce: number;
  } | null>(null);
  const sourceSelectionNonce = useRef(0);
  replaceOpenRef.current = replaceOpen;

  const changeReplaceOpen = useCallback((nextOpen: boolean) => {
    replaceOpenRef.current = nextOpen;
    setReplaceOpen(nextOpen);
  }, []);

  const matches = useMemo(() => {
    if (!query) return [];
    if (markdownSource) return findPlainTextMatches(rawText, query);
    if (!editor) return [];
    return findEditorMatches(editor, query);
  }, [contentVersion, editor, markdownSource, query, rawText, rel]);

  const selectedIndex =
    matches.length === 0 ? 0 : Math.min(activeMatch, matches.length - 1);

  const selectSourceMatch = useCallback((match: FindMatch) => {
    sourceSelectionNonce.current += 1;
    setSourceSelection({ ...match, nonce: sourceSelectionNonce.current });
  }, []);

  const selectMatch = useCallback(
    (index: number) => {
      if (matches.length === 0) return;
      const nextIndex = wrapIndex(index, matches.length);
      const match = matches[nextIndex];
      setActiveMatch(nextIndex);
      if (markdownSource) selectSourceMatch(match);
      else if (editor) selectEditorMatch(editor, match);
    },
    [editor, markdownSource, matches, selectSourceMatch],
  );

  const replaceCurrent = useCallback(() => {
    if (!query || matches.length === 0) return;
    const match = matches[selectedIndex];

    if (markdownSource) {
      applyRawTextChange(replaceTextRange(rawText, match, replaceText));
      selectSourceMatch({ from: match.from, to: match.from + replaceText.length });
      return;
    }

    if (!editor) return;
    editor.view.dispatch(
      editor.state.tr
        .insertText(replaceText, match.from, match.to)
        .scrollIntoView(),
    );
  }, [
    applyRawTextChange,
    editor,
    markdownSource,
    matches,
    query,
    rawText,
    replaceText,
    selectSourceMatch,
    selectedIndex,
  ]);

  const replaceAll = useCallback(() => {
    if (!query || matches.length === 0) return;
    const total = matches.length;

    if (markdownSource) {
      applyRawTextChange(replaceMatches(rawText, matches, replaceText));
    } else if (editor) {
      let transaction = editor.state.tr;
      for (const match of [...matches].sort((a, b) => b.from - a.from)) {
        transaction = transaction.insertText(replaceText, match.from, match.to);
      }
      editor.view.dispatch(transaction.scrollIntoView());
    } else {
      return;
    }

    setActiveMatch(0);
    toast(`Replaced ${total} ${total === 1 ? "match" : "matches"}`);
  }, [
    applyRawTextChange,
    editor,
    markdownSource,
    matches,
    query,
    rawText,
    replaceText,
  ]);

  useEffect(() => {
    setActiveMatch(0);
  }, [markdownSource, query, rel]);

  useEffect(() => {
    if (activeMatch < matches.length) return;
    setActiveMatch(Math.max(0, matches.length - 1));
  }, [activeMatch, matches.length]);

  useEffect(() => {
    if (!open || !query || matches.length === 0) return;
    const match = matches[selectedIndex];
    if (markdownSource) selectSourceMatch(match);
    else if (editor) selectEditorMatch(editor, match);
  }, [
    editor,
    markdownSource,
    matches,
    open,
    query,
    selectSourceMatch,
    selectedIndex,
  ]);

  useEffect(() => {
    if (!editor) return;
    updateFindHighlights(
      editor,
      active && !markdownSource && open && query ? matches : [],
      selectedIndex,
    );
  }, [active, editor, markdownSource, matches, open, query, selectedIndex]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const shortcuts = useShortcuts.getState().bindings;
      const replaceShortcut = matchesShortcut(event, shortcuts.replaceInNote);
      const findShortcut = matchesShortcut(event, shortcuts.findInNote);
      if (!replaceShortcut && !findShortcut) return;
      const ui = useUi.getState();
      if (ui.paletteOpen || ui.settingsOpen) return;
      event.preventDefault();
      setOpen(true);
      if (replaceShortcut) changeReplaceOpen(!replaceOpenRef.current);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [active, changeReplaceOpen]);

  const openFind = useCallback(() => setOpen(true), []);
  const closeFind = useCallback(() => {
    setOpen(false);
    changeReplaceOpen(false);
  }, [changeReplaceOpen]);
  const previous = useCallback(
    () => selectMatch(selectedIndex - 1),
    [selectMatch, selectedIndex],
  );
  const next = useCallback(
    () => selectMatch(selectedIndex + 1),
    [selectMatch, selectedIndex],
  );

  return {
    open,
    openFind,
    closeFind,
    query,
    setQuery,
    replaceText,
    setReplaceText,
    replaceOpen,
    setReplaceOpen: changeReplaceOpen,
    current: query && matches.length > 0 ? selectedIndex + 1 : 0,
    total: query ? matches.length : 0,
    previous,
    next,
    replaceCurrent,
    replaceAll,
    sourceSelection,
  };
}
