import { Extension } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightActiveLine,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  bracketMatching,
  defaultHighlightStyle,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { lintKeymap } from "@codemirror/lint";

import { createMarkdownExtension } from "./markdown";
import { draftTheme, draftSyntaxHighlighting } from "./theme";

export function createEditorSetup(): Extension[] {
  return [
    // Core features (minimal setup for clean look)
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),

    // Keymaps
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap,
      indentWithTab,
    ]),

    // Markdown support
    createMarkdownExtension(),

    // Theme
    draftTheme,
    draftSyntaxHighlighting,

    // Editor styling - clean minimal look
    EditorView.theme({
      "&": {
        height: "100%",
      },
      ".cm-scroller": {
        overflow: "auto",
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      },
      ".cm-content": {
        minHeight: "100%",
        maxWidth: "720px",
        margin: "0 auto",
        padding: "48px 32px",
      },
      ".cm-gutters": {
        display: "none",
      },
      "&.cm-focused": {
        outline: "none",
      },
    }),

    // Line wrapping
    EditorView.lineWrapping,
  ];
}
