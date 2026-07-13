const BLOCK_MARKDOWN = [
  /^ {0,3}#{1,6}[ \t]+\S/m,
  /^ {0,3}(?:[-+*]|\d+[.)])[ \t]+\S/m,
  /^ {0,3}>[ \t]+\S/m,
  /^ {0,3}```[^\n]*$/m,
  /^ {0,3}~~~[^\n]*$/m,
  /^ {0,3}(?:-{3,}|\*{3,}|_{3,})[ \t]*$/m,
  /^ {0,3}-[ \t]+\[[ xX]\][ \t]+\S/m,
  /^\s*\|?.+\|.+\r?\n\s*\|?[ \t]*:?-{3,}:?[ \t]*\|/m,
];

const INLINE_MARKDOWN = [
  /!\[[^\]]*\]\([^\n)]+\)/,
  /\[[^\]\n]+\]\([^\n)]+\)/,
  /(?:\*\*|__)[^\n]+(?:\*\*|__)/,
  /~~[^\n~]+~~/,
  /`[^\n`]+`/,
];

const MDX_COMPONENT = /^\s*<\/?[A-Z][A-Za-z0-9.]*(?:\s|\/?>)/m;

/** Rich Tiptap nodes cannot safely round-trip arbitrary MDX components. */
export function containsMdx(text: string) {
  return MDX_COMPONENT.test(text);
}

/**
 * Rich notes cannot execute MDX components. Remove their tags while retaining
 * the readable Markdown and text nested between opening and closing tags.
 */
export function stripMdxComponents(text: string) {
  return text.replace(
    /<\/?[A-Z][A-Za-z0-9.]*(?:\s[^<>]*?)?\s*\/?>/g,
    "",
  );
}

/**
 * Detect pasted text that should be parsed as Markdown instead of being left
 * to the browser's clipboard HTML handling. This intentionally requires real
 * Markdown syntax so ordinary prose keeps its native paste behavior.
 */
export function isMarkdownPaste(text: string) {
  const value = text.trim();
  if (!value) return false;
  return [...BLOCK_MARKDOWN, ...INLINE_MARKDOWN].some((pattern) =>
    pattern.test(value),
  );
}
