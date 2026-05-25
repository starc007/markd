import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const wikiLinkPattern = /\[\[([^\]]+)\]\]/g;

function createDocumentIcon() {
  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.className =
    "mr-1 inline-flex h-3.5 w-3.5 items-center justify-center align-[-2px] text-muted dark:text-muted-dark";
  icon.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.75h6.35L18 8.4v11.85H7z"/><path d="M13.25 3.95V8.5H18"/><path d="M9.5 12.25h5"/><path d="M9.5 15.5h4"/></svg>';
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
                      "cursor-pointer rounded-md text-ink underline decoration-line underline-offset-4 transition-colors hover:text-muted dark:text-ink-dark dark:hover:text-muted-dark",
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
