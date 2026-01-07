import {
  Completion,
  CompletionContext,
  CompletionResult,
  autocompletion,
} from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";

// Block types available via slash commands
const blockTypes: Completion[] = [
  {
    label: "Heading 1",
    detail: "Large section heading",
    type: "keyword",
    apply: (
      view: EditorView,
      _completion: Completion,
      from: number,
      to: number
    ) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({
        changes: { from: line.from, to, insert: "# " },
      });
    },
  },
  {
    label: "Heading 2",
    detail: "Medium section heading",
    type: "keyword",
    apply: (
      view: EditorView,
      _completion: Completion,
      from: number,
      to: number
    ) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({
        changes: { from: line.from, to, insert: "## " },
      });
    },
  },
  {
    label: "Heading 3",
    detail: "Small section heading",
    type: "keyword",
    apply: (
      view: EditorView,
      _completion: Completion,
      from: number,
      to: number
    ) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({
        changes: { from: line.from, to, insert: "### " },
      });
    },
  },
  {
    label: "Bullet List",
    detail: "Create a bulleted list",
    type: "keyword",
    apply: (
      view: EditorView,
      _completion: Completion,
      from: number,
      to: number
    ) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({
        changes: { from: line.from, to, insert: "- " },
      });
    },
  },
  {
    label: "Numbered List",
    detail: "Create a numbered list",
    type: "keyword",
    apply: (
      view: EditorView,
      _completion: Completion,
      from: number,
      to: number
    ) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({
        changes: { from: line.from, to, insert: "1. " },
      });
    },
  },
  {
    label: "Task List",
    detail: "Create a to-do list",
    type: "keyword",
    apply: (
      view: EditorView,
      _completion: Completion,
      from: number,
      to: number
    ) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({
        changes: { from: line.from, to, insert: "- [ ] " },
      });
    },
  },
  {
    label: "Quote",
    detail: "Create a blockquote",
    type: "keyword",
    apply: (
      view: EditorView,
      _completion: Completion,
      from: number,
      to: number
    ) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({
        changes: { from: line.from, to, insert: "> " },
      });
    },
  },
  {
    label: "Code Block",
    detail: "Create a code block",
    type: "keyword",
    apply: (
      view: EditorView,
      _completion: Completion,
      from: number,
      to: number
    ) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({
        changes: { from: line.from, to, insert: "```\n\n```" },
        selection: { anchor: line.from + 4 },
      });
    },
  },
  {
    label: "Divider",
    detail: "Create a horizontal line",
    type: "keyword",
    apply: (
      view: EditorView,
      _completion: Completion,
      from: number,
      to: number
    ) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({
        changes: { from: line.from, to, insert: "---\n" },
      });
    },
  },
  {
    label: "Link",
    detail: "Insert a link",
    type: "keyword",
    apply: (
      view: EditorView,
      _completion: Completion,
      from: number,
      to: number
    ) => {
      view.dispatch({
        changes: { from, to, insert: "[link text](url)" },
        selection: { anchor: from + 1, head: from + 10 },
      });
    },
  },
  {
    label: "Image",
    detail: "Insert an image",
    type: "keyword",
    apply: (
      view: EditorView,
      _completion: Completion,
      from: number,
      to: number
    ) => {
      view.dispatch({
        changes: { from, to, insert: "![alt text](image-url)" },
        selection: { anchor: from + 2, head: from + 10 },
      });
    },
  },
  {
    label: "Bold",
    detail: "Make text bold",
    type: "keyword",
    apply: (
      view: EditorView,
      _completion: Completion,
      from: number,
      to: number
    ) => {
      view.dispatch({
        changes: { from, to, insert: "**bold**" },
        selection: { anchor: from + 2, head: from + 6 },
      });
    },
  },
  {
    label: "Italic",
    detail: "Make text italic",
    type: "keyword",
    apply: (
      view: EditorView,
      _completion: Completion,
      from: number,
      to: number
    ) => {
      view.dispatch({
        changes: { from, to, insert: "_italic_" },
        selection: { anchor: from + 1, head: from + 7 },
      });
    },
  },
  {
    label: "Inline Code",
    detail: "Insert inline code",
    type: "keyword",
    apply: (
      view: EditorView,
      _completion: Completion,
      from: number,
      to: number
    ) => {
      view.dispatch({
        changes: { from, to, insert: "`code`" },
        selection: { anchor: from + 1, head: from + 5 },
      });
    },
  },
];

// Slash command completion
function slashCommandCompletion(
  context: CompletionContext
): CompletionResult | null {
  const line = context.state.doc.lineAt(context.pos);
  const lineText = line.text;
  const cursorInLine = context.pos - line.from;

  // Check if we're after a slash at the beginning of line or after whitespace
  const beforeCursor = lineText.slice(0, cursorInLine);
  const slashMatch = beforeCursor.match(/(?:^|\s)\/(\w*)$/);

  if (!slashMatch) return null;

  const query = slashMatch[1].toLowerCase();
  const slashPos = line.from + beforeCursor.lastIndexOf("/");

  const filtered = blockTypes.filter(
    (item) =>
      item.label.toLowerCase().includes(query) ||
      (item.detail && item.detail.toLowerCase().includes(query))
  );

  if (filtered.length === 0) return null;

  return {
    from: slashPos,
    options: filtered,
    filter: false,
  };
}

// Extension for slash commands
export function slashCommandsExtension() {
  return autocompletion({
    override: [slashCommandCompletion],
    defaultKeymap: true,
    icons: false,
  });
}

// Styles for the completion menu
export const slashCommandStyles = EditorView.baseTheme({
  ".cm-tooltip.cm-tooltip-autocomplete": {
    backgroundColor: "var(--color-card, #ffffff)",
    border: "1px solid var(--color-border, #e5e5e5)",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    padding: "4px",
    minWidth: "220px",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul": {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    maxHeight: "300px",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
    padding: "8px 12px",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
    backgroundColor: "var(--color-accent, #f5f5f5)",
  },
  ".cm-completionLabel": {
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--color-foreground, #0a0a0a)",
  },
  ".cm-completionDetail": {
    fontSize: "12px",
    color: "var(--color-muted-foreground, #737373)",
    marginLeft: "0 !important",
    fontStyle: "normal !important",
  },
});
