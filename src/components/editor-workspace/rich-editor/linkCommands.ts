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
    chain
      .insertContent({
        type: "text",
        text: url.replace(/^https?:\/\//i, ""),
        marks: [{ type: "link", attrs: { href: url } }],
      })
      .run();
    return true;
  }

  chain.extendMarkRange("link").setLink({ href: url }).run();
  return true;
}

export function applyImageUrl(editor: Editor, href: string, from: number, to: number) {
  const url = normalizeUrl(href);
  if (!url) return false;

  editor.chain().focus().setTextSelection({ from, to }).setImage({ src: url }).run();
  return true;
}

export function promptForUrlLink(editor: Editor) {
  const { from, to, empty } = editor.state.selection;
  const previousUrl = editor.getAttributes("link").href as string | undefined;
  const href = window.prompt("Link URL", previousUrl ?? "https://");

  if (href === null) return false;

  return applyUrlLink(editor, href, from, empty ? from : to);
}

export function promptForImageUrl(editor: Editor) {
  const { from, to } = editor.state.selection;
  const href = window.prompt("Image URL", "https://");
  if (href === null) return false;

  return applyImageUrl(editor, href, from, to);
}
