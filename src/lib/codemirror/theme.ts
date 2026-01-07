import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// Monochrome light theme
export const draftTheme = EditorView.theme(
  {
    "&": {
      color: "#0a0a0a",
      backgroundColor: "transparent",
      fontSize: "16px",
      fontFamily:
        '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    },
    ".cm-content": {
      caretColor: "#0a0a0a",
      lineHeight: "1.7",
      padding: "48px 32px",
      maxWidth: "720px",
      margin: "0 auto",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#0a0a0a",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "#0a0a0a",
    },
    ".cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "#e5e5e5 !important",
    },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "#d4d4d4 !important",
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
      padding: "0",
    },
    // Markdown specific styles
    ".cm-header-1": {
      fontSize: "2em",
      fontWeight: "700",
      lineHeight: "1.3",
      color: "#0a0a0a",
    },
    ".cm-header-2": {
      fontSize: "1.5em",
      fontWeight: "600",
      lineHeight: "1.4",
      color: "#171717",
    },
    ".cm-header-3": {
      fontSize: "1.25em",
      fontWeight: "600",
      lineHeight: "1.5",
      color: "#262626",
    },
    ".cm-header-4": {
      fontSize: "1.1em",
      fontWeight: "600",
      lineHeight: "1.5",
      color: "#404040",
    },
    ".cm-header-5, .cm-header-6": {
      fontSize: "1em",
      fontWeight: "600",
      lineHeight: "1.5",
      color: "#525252",
    },
    ".cm-link": {
      color: "#525252",
      textDecoration: "underline",
      textUnderlineOffset: "2px",
    },
    ".cm-url": {
      color: "#737373",
    },
    ".cm-formatting": {
      color: "#a3a3a3",
    },
  },
  { dark: false }
);

// Syntax highlighting - Monochrome
export const draftHighlightStyle = HighlightStyle.define([
  // Headers
  { tag: t.heading1, fontWeight: "700", fontSize: "2em", color: "#0a0a0a" },
  { tag: t.heading2, fontWeight: "600", fontSize: "1.5em", color: "#171717" },
  { tag: t.heading3, fontWeight: "600", fontSize: "1.25em", color: "#262626" },
  { tag: t.heading4, fontWeight: "600", fontSize: "1.1em", color: "#404040" },
  { tag: t.heading5, fontWeight: "600", color: "#525252" },
  { tag: t.heading6, fontWeight: "600", color: "#525252" },

  // Emphasis
  { tag: t.strong, fontWeight: "600", color: "#171717" },
  { tag: t.emphasis, fontStyle: "italic", color: "#404040" },
  { tag: t.strikethrough, textDecoration: "line-through", color: "#737373" },

  // Links and URLs
  {
    tag: t.link,
    color: "#525252",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
  },
  { tag: t.url, color: "#737373" },

  // Code
  {
    tag: t.monospace,
    fontFamily: '"JetBrains Mono", "SF Mono", Menlo, Monaco, monospace',
    fontSize: "0.9em",
    backgroundColor: "#f5f5f5",
    padding: "2px 4px",
    borderRadius: "4px",
    color: "#262626",
  },

  // Comments and meta
  { tag: t.comment, color: "#a3a3a3", fontStyle: "italic" },
  { tag: t.meta, color: "#a3a3a3" },

  // Processing instructions and formatting
  { tag: t.processingInstruction, color: "#a3a3a3" },

  // Quote
  {
    tag: t.quote,
    color: "#525252",
    fontStyle: "italic",
    borderLeft: "3px solid #e5e5e5",
    paddingLeft: "16px",
  },

  // Lists
  { tag: t.list, color: "#404040" },

  // Content
  { tag: t.content, color: "#171717" },

  // Separator / HR
  { tag: t.separator, color: "#d4d4d4" },

  // Code block content - programming syntax highlighting (monochrome)
  { tag: t.keyword, color: "#262626", fontWeight: "600" },
  { tag: t.operator, color: "#404040" },
  { tag: t.punctuation, color: "#525252" },
  { tag: t.bracket, color: "#525252" },
  { tag: t.string, color: "#404040" },
  { tag: t.number, color: "#171717" },
  { tag: t.bool, color: "#262626" },
  { tag: t.null, color: "#737373" },
  { tag: t.className, color: "#171717", fontWeight: "500" },
  { tag: t.function(t.variableName), color: "#262626" },
  { tag: t.variableName, color: "#404040" },
  { tag: t.propertyName, color: "#404040" },
  { tag: t.typeName, color: "#262626" },
  { tag: t.tagName, color: "#262626" },
  { tag: t.attributeName, color: "#525252" },
  { tag: t.attributeValue, color: "#404040" },
  { tag: t.regexp, color: "#525252" },
  { tag: t.escape, color: "#737373" },
  { tag: t.invalid, color: "#525252", textDecoration: "underline wavy" },
]);

export const draftSyntaxHighlighting = syntaxHighlighting(draftHighlightStyle);

// Dark theme version
export const draftDarkTheme = EditorView.theme(
  {
    "&": {
      color: "#fafafa",
      backgroundColor: "transparent",
      fontSize: "16px",
      fontFamily:
        '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    },
    ".cm-content": {
      caretColor: "#fafafa",
      lineHeight: "1.7",
      padding: "48px 32px",
      maxWidth: "720px",
      margin: "0 auto",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#fafafa",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "#fafafa",
    },
    ".cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "#404040 !important",
    },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "#525252 !important",
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
      padding: "0",
    },
    // Markdown specific styles
    ".cm-header-1": {
      fontSize: "2em",
      fontWeight: "700",
      lineHeight: "1.3",
      color: "#fafafa",
    },
    ".cm-header-2": {
      fontSize: "1.5em",
      fontWeight: "600",
      lineHeight: "1.4",
      color: "#f5f5f5",
    },
    ".cm-header-3": {
      fontSize: "1.25em",
      fontWeight: "600",
      lineHeight: "1.5",
      color: "#e5e5e5",
    },
    ".cm-header-4": {
      fontSize: "1.1em",
      fontWeight: "600",
      lineHeight: "1.5",
      color: "#d4d4d4",
    },
    ".cm-header-5, .cm-header-6": {
      fontSize: "1em",
      fontWeight: "600",
      lineHeight: "1.5",
      color: "#a3a3a3",
    },
    ".cm-link": {
      color: "#a3a3a3",
      textDecoration: "underline",
      textUnderlineOffset: "2px",
    },
    ".cm-url": {
      color: "#737373",
    },
    ".cm-formatting": {
      color: "#525252",
    },
  },
  { dark: true }
);

export const draftDarkHighlightStyle = HighlightStyle.define([
  // Headers
  { tag: t.heading1, fontWeight: "700", fontSize: "2em", color: "#fafafa" },
  { tag: t.heading2, fontWeight: "600", fontSize: "1.5em", color: "#f5f5f5" },
  { tag: t.heading3, fontWeight: "600", fontSize: "1.25em", color: "#e5e5e5" },
  { tag: t.heading4, fontWeight: "600", fontSize: "1.1em", color: "#d4d4d4" },
  { tag: t.heading5, fontWeight: "600", color: "#a3a3a3" },
  { tag: t.heading6, fontWeight: "600", color: "#a3a3a3" },

  // Emphasis
  { tag: t.strong, fontWeight: "600", color: "#f5f5f5" },
  { tag: t.emphasis, fontStyle: "italic", color: "#d4d4d4" },
  { tag: t.strikethrough, textDecoration: "line-through", color: "#737373" },

  // Links and URLs
  {
    tag: t.link,
    color: "#a3a3a3",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
  },
  { tag: t.url, color: "#737373" },

  // Code
  {
    tag: t.monospace,
    fontFamily: '"JetBrains Mono", "SF Mono", Menlo, Monaco, monospace',
    fontSize: "0.9em",
    backgroundColor: "#262626",
    padding: "2px 4px",
    borderRadius: "4px",
    color: "#e5e5e5",
  },

  // Comments and meta
  { tag: t.comment, color: "#525252", fontStyle: "italic" },
  { tag: t.meta, color: "#525252" },

  // Processing instructions
  { tag: t.processingInstruction, color: "#525252" },

  // Quote
  {
    tag: t.quote,
    color: "#a3a3a3",
    fontStyle: "italic",
    borderLeft: "3px solid #404040",
    paddingLeft: "16px",
  },

  // Lists
  { tag: t.list, color: "#d4d4d4" },

  // Content
  { tag: t.content, color: "#e5e5e5" },

  // Separator / HR
  { tag: t.separator, color: "#404040" },

  // Code block content - monochrome
  { tag: t.keyword, color: "#e5e5e5", fontWeight: "600" },
  { tag: t.operator, color: "#d4d4d4" },
  { tag: t.punctuation, color: "#a3a3a3" },
  { tag: t.bracket, color: "#a3a3a3" },
  { tag: t.string, color: "#d4d4d4" },
  { tag: t.number, color: "#f5f5f5" },
  { tag: t.bool, color: "#e5e5e5" },
  { tag: t.null, color: "#737373" },
  { tag: t.className, color: "#f5f5f5", fontWeight: "500" },
  { tag: t.function(t.variableName), color: "#e5e5e5" },
  { tag: t.variableName, color: "#d4d4d4" },
  { tag: t.propertyName, color: "#d4d4d4" },
  { tag: t.typeName, color: "#e5e5e5" },
  { tag: t.tagName, color: "#e5e5e5" },
  { tag: t.attributeName, color: "#a3a3a3" },
  { tag: t.attributeValue, color: "#d4d4d4" },
  { tag: t.regexp, color: "#a3a3a3" },
  { tag: t.escape, color: "#737373" },
  { tag: t.invalid, color: "#a3a3a3", textDecoration: "underline wavy" },
]);

export const draftDarkSyntaxHighlighting = syntaxHighlighting(
  draftDarkHighlightStyle
);
