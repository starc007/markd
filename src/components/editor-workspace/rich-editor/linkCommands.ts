import type { Editor } from "@tiptap/react";

function normalizeUrl(value: string) {
  const url = value.trim();
  if (!url) return "";
  if (/^(https?:|mailto:)/i.test(url)) return url;
  return `https://${url}`;
}

export function promptForUrlLink(editor: Editor) {
  const { from, to, empty } = editor.state.selection;
  const previousUrl = editor.getAttributes("link").href as string | undefined;
  const href = window.prompt("Link URL", previousUrl ?? "https://");

  if (href === null) return false;

  const url = normalizeUrl(href);
  const chain = editor.chain().focus().setTextSelection({ from, to });

  if (!url) {
    chain.extendMarkRange("link").unsetLink().run();
    return true;
  }

  if (empty) {
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
