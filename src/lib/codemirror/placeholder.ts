import {
  EditorView,
  ViewPlugin,
  DecorationSet,
  Decoration,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

class PlaceholderWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-placeholder-text";
    span.textContent = this.text;
    return span;
  }

  ignoreEvent() {
    return false;
  }
}

// Placeholder that shows when editor is empty or on empty lines
export const placeholderPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: {
      view: EditorView;
      docChanged: boolean;
      selectionSet: boolean;
    }) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      const doc = view.state.doc;

      // Show placeholder on first line if document is empty or first line is empty
      const firstLine = doc.line(1);
      const isFirstLineEmpty = firstLine.text.trim() === "";
      const isDocEmpty =
        doc.length === 0 || (doc.lines === 1 && isFirstLineEmpty);

      // Get cursor position
      const cursorPos = view.state.selection.main.head;
      const cursorLine = doc.lineAt(cursorPos);

      if (isDocEmpty || (isFirstLineEmpty && cursorLine.number === 1)) {
        builder.add(
          firstLine.from,
          firstLine.from,
          Decoration.widget({
            widget: new PlaceholderWidget("Type '/' for commands..."),
            side: 1,
          })
        );
      }

      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// Styles for placeholder
export const placeholderStyles = EditorView.baseTheme({
  ".cm-placeholder-text": {
    color: "rgba(55, 53, 47, 0.4)",
    fontStyle: "normal",
    pointerEvents: "none",
    position: "absolute",
  },
});

export function placeholderExtension() {
  return [placeholderPlugin, placeholderStyles];
}
