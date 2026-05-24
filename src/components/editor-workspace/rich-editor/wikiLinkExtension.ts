import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const wikiLinkPattern = /\[\[([^\]]+)\]\]/g;

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
                decorations.push(
                  Decoration.inline(position + index, position + index + match[0].length, {
                    class:
                      "rounded-md bg-selection px-1 text-ink decoration-transparent dark:bg-selection-dark dark:text-ink-dark",
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
