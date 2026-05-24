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
                const from = position + index;
                const titleFrom = from + 2;
                const titleTo = titleFrom + match[1].length;
                const to = from + match[0].length;

                decorations.push(
                  Decoration.inline(from, titleFrom, {
                    class: "hidden",
                  }),
                  Decoration.inline(titleFrom, titleTo, {
                    class:
                      "cursor-pointer underline decoration-line underline-offset-4 before:mr-1 before:inline-block before:h-3 before:w-2 before:rounded-[2px] before:border before:border-current before:align-[-1px] text-ink dark:text-ink-dark",
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
