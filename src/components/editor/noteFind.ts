import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export type FindMatch = { from: number; to: number };

type FindHighlightState = { matches: FindMatch[]; activeIndex: number };

const findHighlightKey = new PluginKey<FindHighlightState>("markd-find");

export const FindHighlightExtension = Extension.create({
  name: "findHighlight",

  addProseMirrorPlugins() {
    return [
      new Plugin<FindHighlightState>({
        key: findHighlightKey,
        state: {
          init: () => ({ matches: [], activeIndex: 0 }),
          apply(transaction, value) {
            const next = transaction.getMeta(findHighlightKey);
            if (next) return next as FindHighlightState;
            if (transaction.docChanged) return { matches: [], activeIndex: 0 };
            return value;
          },
        },
        props: {
          decorations(state) {
            const pluginState = findHighlightKey.getState(state);
            if (!pluginState?.matches.length) return null;
            return DecorationSet.create(
              state.doc,
              pluginState.matches.map((match, index) =>
                Decoration.inline(match.from, match.to, {
                  class:
                    index === pluginState.activeIndex
                      ? "markd-find-match markd-find-match-active"
                      : "markd-find-match",
                }),
              ),
            );
          },
        },
      }),
    ];
  },
});

export function updateFindHighlights(
  editor: Editor,
  matches: FindMatch[],
  activeIndex: number,
) {
  editor.view.dispatch(
    editor.state.tr.setMeta(findHighlightKey, { activeIndex, matches }),
  );
}

export function findPlainTextMatches(
  text: string,
  query: string,
): FindMatch[] {
  const needle = query.toLocaleLowerCase();
  if (!needle) return [];

  const matches: FindMatch[] = [];
  const haystack = text.toLocaleLowerCase();
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    matches.push({ from: index, to: index + query.length });
    index = haystack.indexOf(needle, index + needle.length);
  }
  return matches;
}

export function findEditorMatches(editor: Editor, query: string): FindMatch[] {
  const needle = query.toLocaleLowerCase();
  if (!needle) return [];

  const matches: FindMatch[] = [];
  editor.state.doc.descendants((node, position) => {
    if (!node.isText) return true;
    const text = node.text ?? "";
    const haystack = text.toLocaleLowerCase();
    let index = haystack.indexOf(needle);
    while (index !== -1) {
      matches.push({
        from: position + index,
        to: position + index + query.length,
      });
      index = haystack.indexOf(needle, index + needle.length);
    }
    return true;
  });
  return matches;
}

export function selectEditorMatch(editor: Editor, match: FindMatch) {
  const transaction = editor.state.tr.setSelection(
    TextSelection.create(editor.state.doc, match.from, match.to),
  );
  editor.view.dispatch(transaction);
  scrollEditorMatchIntoView(editor, match);
}

function scrollEditorMatchIntoView(editor: Editor, match: FindMatch) {
  const scrollPane = editor.view.dom.closest<HTMLElement>(".page-scroll");
  if (!scrollPane) return;

  const matchCoords = editor.view.coordsAtPos(match.from);
  const paneBounds = scrollPane.getBoundingClientRect();
  const visibleTop = paneBounds.top + 64;
  const visibleBottom = paneBounds.bottom - 24;
  if (
    matchCoords.top >= visibleTop &&
    matchCoords.bottom <= visibleBottom
  ) {
    return;
  }

  const matchCenter = (matchCoords.top + matchCoords.bottom) / 2;
  const paneCenter = paneBounds.top + paneBounds.height / 2;
  scrollPane.scrollTop += matchCenter - paneCenter;
}

export function replaceTextRange(
  text: string,
  match: FindMatch,
  replacement: string,
) {
  return `${text.slice(0, match.from)}${replacement}${text.slice(match.to)}`;
}

export function replaceMatches(
  text: string,
  matches: FindMatch[],
  replacement: string,
) {
  return [...matches]
    .sort((a, b) => b.from - a.from)
    .reduce(
      (nextText, match) => replaceTextRange(nextText, match, replacement),
      text,
    );
}

export function wrapIndex(index: number, length: number) {
  if (length === 0) return 0;
  return ((index % length) + length) % length;
}
