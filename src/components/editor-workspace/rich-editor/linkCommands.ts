import type { Editor } from "@tiptap/react";

export function normalizeUrl(value: string) {
  const url = value.trim();
  if (!url) return "";
  if (/^(https?:|mailto:)/i.test(url)) return url;
  return `https://${url}`;
}

export function applyUrlLink(editor: Editor, href: string, from: number, to: number) {
  const url = normalizeUrl(href);
  const chain = editor.chain().focus().setTextSelection({ from, to });

  if (!url) {
    chain.extendMarkRange("link").unsetLink().run();
    return true;
  }

  if (from === to) {
    const label = url.replace(/^https?:\/\//i, "");
    chain
      .insertContent([
        {
          type: "text",
          text: label,
          marks: [{ type: "link", attrs: { href: url } }],
        },
        {
          type: "text",
          text: " ",
        },
      ])
      .setTextSelection(from + label.length + 1)
      .unsetMark("link")
      .run();
    return true;
  }

  chain
    .extendMarkRange("link")
    .setLink({ href: url })
    .setTextSelection(to)
    .unsetMark("link")
    .run();
  return true;
}

export function applyImageUrl(editor: Editor, href: string, from: number, to: number) {
  const url = normalizeUrl(href);
  if (!url) return false;

  editor.chain().focus().setTextSelection({ from, to }).setImage({ src: url }).run();
  return true;
}

export function applyImageAsset(
  editor: Editor,
  displaySrc: string,
  workspaceSrc: string,
  from: number,
  to: number,
) {
  if (!displaySrc || !workspaceSrc) return false;

  editor
    .chain()
    .focus()
    .setTextSelection({ from, to })
    .insertContent({
      type: "image",
      attrs: {
        src: displaySrc,
        workspaceSrc,
      },
    })
    .run();
  return true;
}
