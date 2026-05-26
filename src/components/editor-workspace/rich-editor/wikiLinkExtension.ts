import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const wikiLinkPattern = /\[\[([^\]]+)\]\]/g;

function createDocumentIcon() {
  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.className =
    "mr-1 inline-flex h-4 w-4 items-center justify-center align-[-3px] text-ink dark:text-ink-dark";
  icon.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.75h6.25L19 7.5v12.75a1 1 0 0 1-1 1H8a3 3 0 0 1-3-3V5.75a3 3 0 0 1 3-3Z"/><path d="M14 3v4.75h4.75"/><path d="M8.25 12.25h7.5"/><path d="M8.25 15.75h5.5"/></svg>';
  return icon;
}

export const WikiLinkExtension = Extension.create({
  name: "wikiLink",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("wikiLink"),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];

            state.doc.descendants((node, position) => {
              if (!node.isText || !node.text) return;

              for (const match of node.text.matchAll(wikiLinkPattern)) {
                const index = match.index ?? 0;
                const from = position + index;
                const titleFrom = from + 2;
                const titleTo = titleFrom + match[1].length;
                const to = from + match[0].length;

                decorations.push(
                  Decoration.inline(from, titleFrom, {
                    class: "hidden",
                  }),
                  Decoration.widget(titleFrom, createDocumentIcon, {
                    side: -1,
                  }),
                  Decoration.inline(titleFrom, titleTo, {
                    class:
                      "cursor-pointer whitespace-normal text-ink underline decoration-line underline-offset-4 transition-colors hover:text-muted dark:text-ink-dark dark:hover:text-muted-dark",
                  }),
                  Decoration.inline(titleTo, to, {
                    class: "hidden",
                  }),
                );
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
