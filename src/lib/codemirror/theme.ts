import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

// macOS native light theme colors
const lightColors = {
  background: "#ffffff",
  foreground: "#1d1d1f",
  selection: "rgba(0, 122, 255, 0.2)",
  cursor: "#007aff",
  gutterBackground: "#f5f5f7",
  gutterForeground: "#86868b",
  lineHighlight: "rgba(0, 0, 0, 0.02)",

  // Syntax colors
  comment: "#6e7681",
  keyword: "#cf222e",
  string: "#0a3069",
  number: "#0550ae",
  function: "#8250df",
  variable: "#953800",
  type: "#116329",
  operator: "#24292f",
  punctuation: "#24292f",
  heading: "#1d1d1f",
  link: "#0969da",
  emphasis: "#24292f",
  strong: "#24292f",
  strikethrough: "#86868b",
  code: "#0550ae",
  codeBackground: "#f6f8fa",
};

// macOS native dark theme colors
const darkColors = {
  background: "#1e1e1e",
  foreground: "#f5f5f7",
  selection: "rgba(10, 132, 255, 0.3)",
  cursor: "#0a84ff",
  gutterBackground: "#252525",
  gutterForeground: "#6e6e73",
  lineHighlight: "rgba(255, 255, 255, 0.03)",

  // Syntax colors
  comment: "#8b949e",
  keyword: "#ff7b72",
  string: "#a5d6ff",
  number: "#79c0ff",
  function: "#d2a8ff",
  variable: "#ffa657",
  type: "#7ee787",
  operator: "#f5f5f7",
  punctuation: "#f5f5f7",
  heading: "#f5f5f7",
  link: "#58a6ff",
  emphasis: "#f5f5f7",
  strong: "#f5f5f7",
  strikethrough: "#6e6e73",
  code: "#79c0ff",
  codeBackground: "#2d2d2d",
};

function createTheme(colors: typeof lightColors, isDark: boolean): Extension {
  const theme = EditorView.theme(
    {
      "&": {
        color: colors.foreground,
        backgroundColor: colors.background,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Mono", Menlo, Monaco, monospace',
        fontSize: "14px",
        lineHeight: "1.6",
      },
      ".cm-content": {
        caretColor: colors.cursor,
        padding: "16px 0",
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: colors.cursor,
        borderLeftWidth: "2px",
      },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
        {
          backgroundColor: colors.selection,
        },
      ".cm-panels": {
        backgroundColor: colors.gutterBackground,
        color: colors.foreground,
      },
      ".cm-panels.cm-panels-top": {
        borderBottom: `1px solid ${isDark ? "#3a3a3c" : "#d1d1d6"}`,
      },
      ".cm-panels.cm-panels-bottom": {
        borderTop: `1px solid ${isDark ? "#3a3a3c" : "#d1d1d6"}`,
      },
      ".cm-searchMatch": {
        backgroundColor: "rgba(255, 214, 0, 0.3)",
        outline: "1px solid rgba(255, 214, 0, 0.5)",
      },
      ".cm-searchMatch.cm-searchMatch-selected": {
        backgroundColor: "rgba(255, 214, 0, 0.5)",
      },
      ".cm-activeLine": {
        backgroundColor: colors.lineHighlight,
      },
      ".cm-selectionMatch": {
        backgroundColor: "rgba(0, 122, 255, 0.1)",
      },
      "&.cm-focused .cm-matchingBracket": {
        backgroundColor: "rgba(0, 122, 255, 0.2)",
        outline: "1px solid rgba(0, 122, 255, 0.4)",
      },
      "&.cm-focused .cm-nonmatchingBracket": {
        backgroundColor: "rgba(255, 59, 48, 0.2)",
      },
      ".cm-gutters": {
        backgroundColor: colors.gutterBackground,
        color: colors.gutterForeground,
        border: "none",
        borderRight: `1px solid ${isDark ? "#3a3a3c" : "#e5e5e5"}`,
      },
      ".cm-activeLineGutter": {
        backgroundColor: colors.lineHighlight,
      },
      ".cm-foldPlaceholder": {
        backgroundColor: "transparent",
        border: "none",
        color: colors.gutterForeground,
      },
      ".cm-tooltip": {
        border: "none",
        backgroundColor: colors.gutterBackground,
        boxShadow: isDark
          ? "0 4px 20px rgba(0, 0, 0, 0.5)"
          : "0 4px 20px rgba(0, 0, 0, 0.15)",
        borderRadius: "8px",
      },
      ".cm-tooltip .cm-tooltip-arrow:before": {
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
      },
      ".cm-tooltip .cm-tooltip-arrow:after": {
        borderTopColor: colors.gutterBackground,
        borderBottomColor: colors.gutterBackground,
      },
      ".cm-tooltip-autocomplete": {
        "& > ul > li[aria-selected]": {
          backgroundColor: colors.selection,
          color: colors.foreground,
        },
      },
      // Markdown-specific styling
      ".cm-header-1": {
        fontSize: "1.75em",
        fontWeight: "700",
        lineHeight: "1.3",
      },
      ".cm-header-2": {
        fontSize: "1.5em",
        fontWeight: "600",
        lineHeight: "1.35",
      },
      ".cm-header-3": {
        fontSize: "1.25em",
        fontWeight: "600",
        lineHeight: "1.4",
      },
      ".cm-header-4": {
        fontSize: "1.1em",
        fontWeight: "600",
      },
      ".cm-header-5, .cm-header-6": {
        fontSize: "1em",
        fontWeight: "600",
      },
      ".cm-link": {
        color: colors.link,
        textDecoration: "none",
      },
      ".cm-url": {
        color: colors.link,
        opacity: 0.7,
      },
      ".cm-code": {
        backgroundColor: colors.codeBackground,
        borderRadius: "4px",
        padding: "2px 6px",
        fontFamily: '"SF Mono", Menlo, Monaco, monospace',
      },
    },
    { dark: isDark }
  );

  const highlighting = HighlightStyle.define([
    { tag: tags.comment, color: colors.comment, fontStyle: "italic" },
    { tag: tags.lineComment, color: colors.comment, fontStyle: "italic" },
    { tag: tags.blockComment, color: colors.comment, fontStyle: "italic" },
    { tag: tags.docComment, color: colors.comment, fontStyle: "italic" },
    { tag: tags.keyword, color: colors.keyword, fontWeight: "500" },
    { tag: tags.controlKeyword, color: colors.keyword, fontWeight: "500" },
    { tag: tags.operatorKeyword, color: colors.keyword },
    { tag: tags.definitionKeyword, color: colors.keyword },
    { tag: tags.moduleKeyword, color: colors.keyword },
    { tag: tags.string, color: colors.string },
    { tag: tags.special(tags.string), color: colors.string },
    { tag: tags.regexp, color: colors.string },
    { tag: tags.escape, color: colors.string },
    { tag: tags.number, color: colors.number },
    { tag: tags.integer, color: colors.number },
    { tag: tags.float, color: colors.number },
    { tag: tags.bool, color: colors.number },
    { tag: tags.null, color: colors.number },
    { tag: tags.function(tags.variableName), color: colors.function },
    {
      tag: tags.definition(tags.function(tags.variableName)),
      color: colors.function,
    },
    { tag: tags.variableName, color: colors.variable },
    { tag: tags.definition(tags.variableName), color: colors.variable },
    { tag: tags.propertyName, color: colors.variable },
    { tag: tags.typeName, color: colors.type },
    { tag: tags.className, color: colors.type },
    { tag: tags.namespace, color: colors.type },
    { tag: tags.labelName, color: colors.variable },
    { tag: tags.attributeName, color: colors.variable },
    { tag: tags.attributeValue, color: colors.string },
    { tag: tags.operator, color: colors.operator },
    { tag: tags.punctuation, color: colors.punctuation },
    { tag: tags.bracket, color: colors.punctuation },
    { tag: tags.angleBracket, color: colors.punctuation },
    { tag: tags.squareBracket, color: colors.punctuation },
    { tag: tags.paren, color: colors.punctuation },
    { tag: tags.brace, color: colors.punctuation },
    { tag: tags.separator, color: colors.punctuation },
    // Markdown-specific
    { tag: tags.heading, color: colors.heading, fontWeight: "700" },
    { tag: tags.heading1, color: colors.heading, fontWeight: "700" },
    { tag: tags.heading2, color: colors.heading, fontWeight: "600" },
    { tag: tags.heading3, color: colors.heading, fontWeight: "600" },
    { tag: tags.heading4, color: colors.heading, fontWeight: "600" },
    { tag: tags.heading5, color: colors.heading, fontWeight: "500" },
    { tag: tags.heading6, color: colors.heading, fontWeight: "500" },
    { tag: tags.link, color: colors.link },
    { tag: tags.url, color: colors.link, opacity: "0.7" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strong, fontWeight: "700" },
    {
      tag: tags.strikethrough,
      textDecoration: "line-through",
      color: colors.strikethrough,
    },
    { tag: tags.monospace, fontFamily: '"SF Mono", Menlo, Monaco, monospace' },
    { tag: tags.processingInstruction, color: colors.code },
    { tag: tags.meta, color: colors.comment },
    { tag: tags.quote, color: colors.comment, fontStyle: "italic" },
    { tag: tags.list, color: colors.keyword },
  ]);

  return [theme, syntaxHighlighting(highlighting)];
}

export const draftLightTheme = createTheme(lightColors, false);
export const draftDarkTheme = createTheme(darkColors, true);

// Auto-detect system theme
export function getSystemTheme(): Extension {
  if (typeof window !== "undefined") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return isDark ? draftDarkTheme : draftLightTheme;
  }
  return draftLightTheme;
}
