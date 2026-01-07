import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// Notion-like light theme
export const draftTheme = EditorView.theme(
  {
    "&": {
      color: "#37352f",
      backgroundColor: "transparent",
      fontSize: "16px",
      fontFamily:
        'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
    },
    ".cm-content": {
      caretColor: "#37352f",
      lineHeight: "1.6",
      padding: "48px 32px",
      maxWidth: "900px",
      margin: "0 auto",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#37352f",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "#37352f",
    },
    ".cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "rgba(45, 170, 219, 0.3) !important",
    },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(45, 170, 219, 0.3) !important",
    },
    ".cm-activeLine": {
      backgroundColor: "transparent",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
    },
    ".cm-gutters": {
      display: "none",
    },
    ".cm-line": {
      padding: "3px 0",
    },
  },
  { dark: false }
);

// Notion-like syntax highlighting
export const draftHighlightStyle = HighlightStyle.define([
  // Headers - Notion style
  {
    tag: t.heading1,
    fontWeight: "700",
    fontSize: "1.875em",
    lineHeight: "1.3",
    color: "#37352f",
    marginTop: "2em",
  },
  {
    tag: t.heading2,
    fontWeight: "600",
    fontSize: "1.5em",
    lineHeight: "1.3",
    color: "#37352f",
    marginTop: "1.4em",
  },
  {
    tag: t.heading3,
    fontWeight: "600",
    fontSize: "1.25em",
    lineHeight: "1.3",
    color: "#37352f",
    marginTop: "1em",
  },
  {
    tag: t.heading4,
    fontWeight: "600",
    fontSize: "1em",
    color: "#37352f",
  },
  { tag: t.heading5, fontWeight: "600", color: "#37352f" },
  { tag: t.heading6, fontWeight: "600", color: "#37352f" },

  // Emphasis
  { tag: t.strong, fontWeight: "600", color: "#37352f" },
  { tag: t.emphasis, fontStyle: "italic", color: "#37352f" },
  { tag: t.strikethrough, textDecoration: "line-through", color: "#9b9a97" },

  // Links
  {
    tag: t.link,
    color: "#37352f",
    textDecoration: "underline",
    textDecorationColor: "rgba(55, 53, 47, 0.4)",
    textUnderlineOffset: "3px",
  },
  { tag: t.url, color: "#9b9a97", fontSize: "0.9em" },

  // Code - Notion red style
  {
    tag: t.monospace,
    fontFamily:
      '"SFMono-Regular", Menlo, Consolas, "PT Mono", "Liberation Mono", Courier, monospace',
    fontSize: "0.875em",
    backgroundColor: "rgba(135, 131, 120, 0.15)",
    color: "#eb5757",
    padding: "0.2em 0.4em",
    borderRadius: "4px",
  },

  // Comments and meta
  { tag: t.comment, color: "#9b9a97", fontStyle: "italic" },
  { tag: t.meta, color: "#9b9a97" },
  { tag: t.processingInstruction, color: "#9b9a97" },

  // Quote
  {
    tag: t.quote,
    color: "#37352f",
    borderLeft: "3px solid #37352f",
    paddingLeft: "14px",
    marginLeft: "0",
  },

  // Lists
  { tag: t.list, color: "#37352f" },

  // Content
  { tag: t.content, color: "#37352f" },

  // Separator
  { tag: t.separator, color: "#e5e5e5" },

  // Code block syntax - subtle colors
  { tag: t.keyword, color: "#0550ae", fontWeight: "500" },
  { tag: t.operator, color: "#37352f" },
  { tag: t.punctuation, color: "#37352f" },
  { tag: t.bracket, color: "#37352f" },
  { tag: t.string, color: "#0a3069" },
  { tag: t.number, color: "#0550ae" },
  { tag: t.bool, color: "#0550ae" },
  { tag: t.null, color: "#9b9a97" },
  { tag: t.className, color: "#953800", fontWeight: "500" },
  { tag: t.function(t.variableName), color: "#8250df" },
  { tag: t.variableName, color: "#953800" },
  { tag: t.propertyName, color: "#0550ae" },
  { tag: t.typeName, color: "#0550ae" },
  { tag: t.tagName, color: "#116329" },
  { tag: t.attributeName, color: "#0550ae" },
  { tag: t.attributeValue, color: "#0a3069" },
  { tag: t.regexp, color: "#0a3069" },
  { tag: t.escape, color: "#0550ae" },
  { tag: t.invalid, color: "#eb5757", textDecoration: "underline wavy" },
]);

export const draftSyntaxHighlighting = syntaxHighlighting(draftHighlightStyle);

// Dark theme version (Notion dark)
export const draftDarkTheme = EditorView.theme(
  {
    "&": {
      color: "rgba(255, 255, 255, 0.9)",
      backgroundColor: "transparent",
      fontSize: "16px",
      fontFamily:
        'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
    },
    ".cm-content": {
      caretColor: "rgba(255, 255, 255, 0.9)",
      lineHeight: "1.6",
      padding: "48px 32px",
      maxWidth: "900px",
      margin: "0 auto",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "rgba(255, 255, 255, 0.9)",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "rgba(255, 255, 255, 0.9)",
    },
    ".cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "rgba(45, 170, 219, 0.3) !important",
    },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(45, 170, 219, 0.3) !important",
    },
    ".cm-activeLine": {
      backgroundColor: "transparent",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
    },
    ".cm-gutters": {
      display: "none",
    },
    ".cm-line": {
      padding: "3px 0",
    },
  },
  { dark: true }
);

export const draftDarkHighlightStyle = HighlightStyle.define([
  // Headers
  {
    tag: t.heading1,
    fontWeight: "700",
    fontSize: "1.875em",
    lineHeight: "1.3",
    color: "rgba(255, 255, 255, 0.9)",
  },
  {
    tag: t.heading2,
    fontWeight: "600",
    fontSize: "1.5em",
    lineHeight: "1.3",
    color: "rgba(255, 255, 255, 0.9)",
  },
  {
    tag: t.heading3,
    fontWeight: "600",
    fontSize: "1.25em",
    lineHeight: "1.3",
    color: "rgba(255, 255, 255, 0.9)",
  },
  {
    tag: t.heading4,
    fontWeight: "600",
    fontSize: "1em",
    color: "rgba(255, 255, 255, 0.9)",
  },
  { tag: t.heading5, fontWeight: "600", color: "rgba(255, 255, 255, 0.9)" },
  { tag: t.heading6, fontWeight: "600", color: "rgba(255, 255, 255, 0.9)" },

  // Emphasis
  { tag: t.strong, fontWeight: "600", color: "rgba(255, 255, 255, 0.9)" },
  { tag: t.emphasis, fontStyle: "italic", color: "rgba(255, 255, 255, 0.9)" },
  {
    tag: t.strikethrough,
    textDecoration: "line-through",
    color: "rgba(255, 255, 255, 0.5)",
  },

  // Links
  {
    tag: t.link,
    color: "rgba(255, 255, 255, 0.9)",
    textDecoration: "underline",
    textDecorationColor: "rgba(255, 255, 255, 0.4)",
  },
  { tag: t.url, color: "rgba(255, 255, 255, 0.5)" },

  // Code
  {
    tag: t.monospace,
    fontFamily: '"SFMono-Regular", Menlo, Consolas, monospace',
    fontSize: "0.875em",
    backgroundColor: "rgba(135, 131, 120, 0.15)",
    color: "#eb5757",
    padding: "0.2em 0.4em",
    borderRadius: "4px",
  },

  // Comments
  { tag: t.comment, color: "rgba(255, 255, 255, 0.5)", fontStyle: "italic" },
  { tag: t.meta, color: "rgba(255, 255, 255, 0.5)" },
  { tag: t.processingInstruction, color: "rgba(255, 255, 255, 0.5)" },

  // Quote
  {
    tag: t.quote,
    color: "rgba(255, 255, 255, 0.9)",
    borderLeft: "3px solid rgba(255, 255, 255, 0.4)",
    paddingLeft: "14px",
  },

  // Lists & content
  { tag: t.list, color: "rgba(255, 255, 255, 0.9)" },
  { tag: t.content, color: "rgba(255, 255, 255, 0.9)" },
  { tag: t.separator, color: "rgba(255, 255, 255, 0.2)" },

  // Code syntax
  { tag: t.keyword, color: "#ff7b72", fontWeight: "500" },
  { tag: t.operator, color: "rgba(255, 255, 255, 0.9)" },
  { tag: t.punctuation, color: "rgba(255, 255, 255, 0.7)" },
  { tag: t.bracket, color: "rgba(255, 255, 255, 0.7)" },
  { tag: t.string, color: "#a5d6ff" },
  { tag: t.number, color: "#79c0ff" },
  { tag: t.bool, color: "#79c0ff" },
  { tag: t.null, color: "rgba(255, 255, 255, 0.5)" },
  { tag: t.className, color: "#ffa657", fontWeight: "500" },
  { tag: t.function(t.variableName), color: "#d2a8ff" },
  { tag: t.variableName, color: "#ffa657" },
  { tag: t.propertyName, color: "#79c0ff" },
  { tag: t.typeName, color: "#79c0ff" },
  { tag: t.tagName, color: "#7ee787" },
  { tag: t.attributeName, color: "#79c0ff" },
  { tag: t.attributeValue, color: "#a5d6ff" },
  { tag: t.regexp, color: "#a5d6ff" },
  { tag: t.escape, color: "#79c0ff" },
  { tag: t.invalid, color: "#eb5757", textDecoration: "underline wavy" },
]);

export const draftDarkSyntaxHighlighting = syntaxHighlighting(
  draftDarkHighlightStyle
);
