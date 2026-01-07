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
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { lintKeymap } from "@codemirror/lint";

import { createMarkdownExtension } from "./markdown";
import { draftTheme, draftSyntaxHighlighting } from "./theme";
import { hideMarksExtension } from "./hideMarks";
import { slashCommandsExtension, slashCommandStyles } from "./slashCommands";
import { placeholderExtension } from "./placeholder";

export function createEditorSetup(): Extension[] {
  return [
    // Core features
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
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

    // Slash commands (Notion-like)
    slashCommandsExtension(),
    slashCommandStyles,

    // Placeholder text
    placeholderExtension(),

    // Theme
    draftTheme,
    draftSyntaxHighlighting,

    // Hide markdown marks for WYSIWYG-like experience
    hideMarksExtension(),

    // Editor styling - Notion-like clean look
    EditorView.theme({
      "&": {
        height: "100%",
      },
      ".cm-scroller": {
        overflow: "auto",
        fontFamily:
          'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica, Arial, sans-serif',
      },
      ".cm-content": {
        minHeight: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "24px 48px 96px 48px",
      },
      ".cm-gutters": {
        display: "none",
      },
      "&.cm-focused": {
        outline: "none",
      },
      // Notion-like line spacing
      ".cm-line": {
        padding: "3px 2px",
      },
      // Code blocks
      ".cm-line:has(.cm-monospace)": {
        backgroundColor: "rgba(135, 131, 120, 0.08)",
        padding: "2px 4px",
        margin: "0 -4px",
        borderRadius: "4px",
      },
    }),

    // Line wrapping
    EditorView.lineWrapping,
  ];
}
