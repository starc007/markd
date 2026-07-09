import { Extension, InputRule } from "@tiptap/core";
import { relToHref, resolveWiki } from "@/lib/noteLinks";
import { flattenNotes } from "@/lib/tree";
import { useVault } from "@/stores/vault";

/**
 * Turns `[[target]]` / `[[target|alias]]` into an internal page link the moment
 * the closing `]]` is typed. The target resolves against the current vault, and
 * the result is a normal link mark (serializes to `[alias](target.md)`), so the
 * file stays plain markdown — `[[ ]]` is only an input shortcut.
 */
export const WikiLink = Extension.create({
  name: "wikiLink",

  addInputRules() {
    return [
      new InputRule({
        find: /\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]$/,
        handler: ({ state, range, match, chain }) => {
          const linkType = state.schema.marks.link;
          if (!linkType) return;
          const notes = flattenNotes(useVault.getState().tree);
          const { rel, title } = resolveWiki(match[1], notes);
          const text = (match[2] ?? title).trim();
          chain()
            .deleteRange(range)
            .insertContent([
              {
                type: "text",
                text,
                marks: [{ type: "link", attrs: { href: relToHref(rel) } }],
              },
              { type: "text", text: " " },
            ])
            .run();
        },
      }),
    ];
  },
});
