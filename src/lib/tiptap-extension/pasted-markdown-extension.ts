import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

export const PasteMarkdownExtension = Extension.create({
  name: "pasteMarkdown",

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        props: {
          handlePaste(_view, event) {
            const text = event.clipboardData?.getData("text/plain");

            if (!text) {
              return false;
            }

            // Check if text looks like Markdown
            if (looksLikeMarkdown(text)) {
              // Get the Markdown extension
              // Parse the Markdown text to Tiptap JSON using the Markdown manager
              const json = editor?.markdown?.parse(text);

              if (!json) {
                return false;
              }

              // Insert the parsed JSON content at cursor position
              editor.commands.insertContent(json);

              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

function looksLikeMarkdown(text: string): boolean {
  // Simple heuristic: check for Markdown syntax
  return (
    /^#{1,6}\s/.test(text) || // Headings
    /\*\*[^*]+\*\*/.test(text) || // Bold
    /\[.+\]\(.+\)/.test(text) || // Links
    /^[-*+]\s/.test(text)
  ); // Lists
}
