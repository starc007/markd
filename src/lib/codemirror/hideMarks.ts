import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

// Widget for checkbox
class CheckboxWidget extends WidgetType {
  constructor(readonly checked: boolean) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = `cm-task-checkbox ${this.checked ? "checked" : ""}`;
    span.innerHTML = this.checked
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="4" fill="#0a0a0a"/><path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="4" stroke="#d4d4d4" stroke-width="2"/></svg>';
    return span;
  }

  eq(other: CheckboxWidget) {
    return other.checked === this.checked;
  }
}

// Widget for bullet point
class BulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-bullet-widget";
    span.innerHTML = "•";
    return span;
  }
}

// Widget for numbered list
class NumberWidget extends WidgetType {
  constructor(readonly num: string) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-number-widget";
    span.textContent = `${this.num}.`;
    return span;
  }

  eq(other: NumberWidget) {
    return other.num === this.num;
  }
}

// Widget for horizontal rule
class HRWidget extends WidgetType {
  toDOM() {
    const div = document.createElement("div");
    div.className = "cm-hr-widget";
    return div;
  }
}

// Widget for blockquote marker
class QuoteWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-quote-widget";
    return span;
  }
}

// Decoration to hide text
const hideDecoration = Decoration.mark({ class: "cm-formatting-hidden" });

// Create decorations that hide markdown formatting
function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  // Get cursor position to avoid hiding marks near cursor
  const cursorPos = view.state.selection.main.head;
  const cursorLine = doc.lineAt(cursorPos).number;

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter(node) {
        const nodeLine = doc.lineAt(node.from).number;
        const isOnCursorLine = nodeLine === cursorLine;

        // Don't hide marks on the line where cursor is
        if (isOnCursorLine) return;

        const nodeType = node.type.name;

        // Hide heading marks (# ## ### etc)
        if (nodeType === "HeaderMark") {
          builder.add(node.from, node.to + 1, hideDecoration); // +1 for space
        }

        // Hide emphasis marks (* ** _ __)
        if (nodeType === "EmphasisMark") {
          builder.add(node.from, node.to, hideDecoration);
        }

        // Hide strikethrough marks (~~)
        if (nodeType === "StrikethroughMark") {
          builder.add(node.from, node.to, hideDecoration);
        }

        // Hide inline code marks (`)
        if (nodeType === "CodeMark") {
          builder.add(node.from, node.to, hideDecoration);
        }

        // Hide link marks [ ]
        if (nodeType === "LinkMark") {
          builder.add(node.from, node.to, hideDecoration);
        }

        // Hide URL in links [text](url) - hide the (url) part
        if (nodeType === "URL") {
          const parent = node.node.parent;
          if (parent && parent.name === "Link") {
            // Hide from ( to )
            const urlStart = node.from - 1;
            const urlEnd = node.to + 1;
            if (urlStart >= 0) {
              builder.add(urlStart, urlEnd, hideDecoration);
            }
          }
        }

        // Handle quote marks (>)
        if (nodeType === "QuoteMark") {
          builder.add(
            node.from,
            node.to + 1,
            Decoration.replace({
              widget: new QuoteWidget(),
            })
          );
        }

        // Handle list marks
        if (nodeType === "ListMark") {
          const line = doc.lineAt(node.from);
          const lineText = line.text;
          const markEnd = node.to - line.from;
          const afterMark = lineText.slice(markEnd);

          // Check if it's a task list [ ] or [x]
          const taskMatch = afterMark.match(/^\s*\[([ xX])\]/);
          if (taskMatch) {
            const isChecked = taskMatch[1].toLowerCase() === "x";
            const checkboxEnd = node.to + afterMark.indexOf("]") + 1;
            builder.add(
              node.from,
              checkboxEnd,
              Decoration.replace({
                widget: new CheckboxWidget(isChecked),
              })
            );
          } else {
            // Check if it's a numbered list
            const numMatch = lineText.match(/^(\d+)\./);
            if (numMatch) {
              builder.add(
                node.from,
                node.to,
                Decoration.replace({
                  widget: new NumberWidget(numMatch[1]),
                })
              );
            } else {
              // Regular bullet list
              builder.add(
                node.from,
                node.to,
                Decoration.replace({
                  widget: new BulletWidget(),
                })
              );
            }
          }
        }

        // Handle horizontal rule
        if (nodeType === "HorizontalRule") {
          builder.add(
            node.from,
            node.to,
            Decoration.replace({
              widget: new HRWidget(),
            })
          );
        }
      },
    });
  }

  return builder.finish();
}

// ViewPlugin to manage decorations
export const hideMarksPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// Styles for hidden formatting and widgets
export const hideMarksStyles = EditorView.baseTheme({
  ".cm-formatting-hidden": {
    fontSize: "0 !important",
    width: "0 !important",
    display: "inline-block",
    overflow: "hidden",
    verticalAlign: "baseline",
  },
  ".cm-task-checkbox": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "8px",
    cursor: "pointer",
    verticalAlign: "middle",
  },
  ".cm-task-checkbox svg": {
    display: "block",
  },
  ".cm-bullet-widget": {
    display: "inline-block",
    width: "24px",
    color: "#737373",
    fontSize: "1.2em",
    lineHeight: "1",
    textAlign: "center",
  },
  ".cm-number-widget": {
    display: "inline-block",
    minWidth: "24px",
    color: "#737373",
    fontSize: "1em",
    textAlign: "right",
    paddingRight: "8px",
  },
  ".cm-hr-widget": {
    display: "block",
    height: "1px",
    backgroundColor: "#e5e5e5",
    margin: "24px 0",
    borderRadius: "1px",
  },
  ".cm-quote-widget": {
    display: "inline-block",
    width: "4px",
    height: "100%",
    backgroundColor: "#e5e5e5",
    marginRight: "12px",
    borderRadius: "2px",
  },
});

// Combined extension
export function hideMarksExtension() {
  return [hideMarksPlugin, hideMarksStyles];
}
