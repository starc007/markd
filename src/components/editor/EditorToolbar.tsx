import {
  TextB,
  TextItalic,
  TextStrikethrough,
  Code,
  ListBullets,
  ListNumbers,
  Quotes,
  Link,
  Image,
  TextHOne,
  TextHTwo,
  TextHThree,
  Minus,
  CheckSquare,
} from "@phosphor-icons/react";
import { EditorView } from "@codemirror/view";
import { IconButton } from "../ui";

interface EditorToolbarProps {
  editorView: EditorView | null;
}

type ToolAction = {
  icon: React.ReactNode;
  label: string;
  action: (view: EditorView) => void;
  shortcut?: string;
};

// Helper to wrap selection with markers
function wrapSelection(view: EditorView, before: string, after: string) {
  const { from, to } = view.state.selection.main;
  const selectedText = view.state.sliceDoc(from, to);

  view.dispatch({
    changes: { from, to, insert: `${before}${selectedText}${after}` },
    selection: { anchor: from + before.length, head: to + before.length },
  });
  view.focus();
}

// Helper to insert at cursor or wrap selection
function insertOrWrap(
  view: EditorView,
  before: string,
  after: string,
  placeholder: string
) {
  const { from, to } = view.state.selection.main;
  const selectedText = view.state.sliceDoc(from, to);

  if (selectedText) {
    wrapSelection(view, before, after);
  } else {
    const insertText = `${before}${placeholder}${after}`;
    view.dispatch({
      changes: { from, to, insert: insertText },
      selection: {
        anchor: from + before.length,
        head: from + before.length + placeholder.length,
      },
    });
    view.focus();
  }
}

// Helper to insert at line start
function insertAtLineStart(view: EditorView, prefix: string) {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);

  view.dispatch({
    changes: { from: line.from, to: line.from, insert: prefix },
  });
  view.focus();
}

const tools: ToolAction[][] = [
  // Text formatting
  [
    {
      icon: <TextB className="w-4 h-4" weight="bold" />,
      label: "Bold",
      shortcut: "⌘B",
      action: (view) => insertOrWrap(view, "**", "**", "bold text"),
    },
    {
      icon: <TextItalic className="w-4 h-4" />,
      label: "Italic",
      shortcut: "⌘I",
      action: (view) => insertOrWrap(view, "_", "_", "italic text"),
    },
    {
      icon: <TextStrikethrough className="w-4 h-4" />,
      label: "Strikethrough",
      action: (view) => insertOrWrap(view, "~~", "~~", "strikethrough"),
    },
    {
      icon: <Code className="w-4 h-4" />,
      label: "Inline Code",
      shortcut: "⌘E",
      action: (view) => insertOrWrap(view, "`", "`", "code"),
    },
  ],
  // Headings
  [
    {
      icon: <TextHOne className="w-4 h-4" weight="bold" />,
      label: "Heading 1",
      action: (view) => insertAtLineStart(view, "# "),
    },
    {
      icon: <TextHTwo className="w-4 h-4" weight="bold" />,
      label: "Heading 2",
      action: (view) => insertAtLineStart(view, "## "),
    },
    {
      icon: <TextHThree className="w-4 h-4" weight="bold" />,
      label: "Heading 3",
      action: (view) => insertAtLineStart(view, "### "),
    },
  ],
  // Lists & Blocks
  [
    {
      icon: <ListBullets className="w-4 h-4" />,
      label: "Bullet List",
      action: (view) => insertAtLineStart(view, "- "),
    },
    {
      icon: <ListNumbers className="w-4 h-4" />,
      label: "Numbered List",
      action: (view) => insertAtLineStart(view, "1. "),
    },
    {
      icon: <CheckSquare className="w-4 h-4" />,
      label: "Task List",
      action: (view) => insertAtLineStart(view, "- [ ] "),
    },
    {
      icon: <Quotes className="w-4 h-4" />,
      label: "Quote",
      action: (view) => insertAtLineStart(view, "> "),
    },
  ],
  // Insert
  [
    {
      icon: <Link className="w-4 h-4" />,
      label: "Link",
      shortcut: "⌘K",
      action: (view) => {
        const { from, to } = view.state.selection.main;
        const selectedText = view.state.sliceDoc(from, to);

        if (selectedText) {
          view.dispatch({
            changes: { from, to, insert: `[${selectedText}](url)` },
            selection: {
              anchor: from + selectedText.length + 3,
              head: from + selectedText.length + 6,
            },
          });
        } else {
          view.dispatch({
            changes: { from, to, insert: "[link text](url)" },
            selection: { anchor: from + 1, head: from + 10 },
          });
        }
        view.focus();
      },
    },
    {
      icon: <Image className="w-4 h-4" />,
      label: "Image",
      action: (view) => {
        const { from, to } = view.state.selection.main;
        view.dispatch({
          changes: { from, to, insert: "![alt text](image-url)" },
          selection: { anchor: from + 2, head: from + 10 },
        });
        view.focus();
      },
    },
    {
      icon: <Minus className="w-4 h-4" />,
      label: "Horizontal Rule",
      action: (view) => {
        const { from } = view.state.selection.main;
        const line = view.state.doc.lineAt(from);
        view.dispatch({
          changes: { from: line.to, to: line.to, insert: "\n\n---\n\n" },
        });
        view.focus();
      },
    },
  ],
];

export function EditorToolbar({ editorView }: EditorToolbarProps) {
  if (!editorView) return null;

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-card/50">
      {tools.map((group, groupIndex) => (
        <div key={groupIndex} className="flex items-center gap-0.5">
          {group.map((tool, toolIndex) => (
            <IconButton
              key={toolIndex}
              onClick={() => tool.action(editorView)}
              title={
                tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label
              }
              size="sm"
            >
              {tool.icon}
            </IconButton>
          ))}
          {groupIndex < tools.length - 1 && (
            <div className="w-px h-5 bg-border mx-1.5" />
          )}
        </div>
      ))}
    </div>
  );
}
