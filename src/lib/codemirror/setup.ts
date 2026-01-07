import { EditorState, Extension } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightActiveLine,
  highlightActiveLineGutter,
  lineNumbers,
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
  foldGutter,
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
import { getSystemTheme } from "./theme";

export interface EditorConfig {
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: () => void;
  theme?: Extension;
  readOnly?: boolean;
}

export function createEditorState(config: EditorConfig = {}): EditorState {
  const extensions: Extension[] = [
    // Core features
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
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
      // Custom save shortcut
      {
        key: "Mod-s",
        run: () => {
          config.onSave?.();
          return true;
        },
      },
    ]),

    // Markdown support
    createMarkdownExtension(),

    // Theme
    config.theme ?? getSystemTheme(),

    // Change listener
    EditorView.updateListener.of((update) => {
      if (update.docChanged && config.onChange) {
        config.onChange(update.state.doc.toString());
      }
    }),

    // Editor styling
    EditorView.theme({
      "&": {
        height: "100%",
      },
      ".cm-scroller": {
        overflow: "auto",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
      },
      ".cm-content": {
        minHeight: "100%",
        maxWidth: "720px",
        margin: "0 auto",
        padding: "32px 24px",
      },
      ".cm-gutters": {
        minWidth: "48px",
      },
      "&.cm-focused": {
        outline: "none",
      },
    }),

    // Line wrapping
    EditorView.lineWrapping,
  ];

  // Read-only mode
  if (config.readOnly) {
    extensions.push(EditorState.readOnly.of(true));
  }

  return EditorState.create({
    doc: config.initialContent ?? "",
    extensions,
  });
}

export function createEditorView(
  parent: HTMLElement,
  config: EditorConfig = {}
): EditorView {
  const state = createEditorState(config);
  return new EditorView({
    state,
    parent,
  });
}
