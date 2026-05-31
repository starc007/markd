export function preserveWikiLinks(markdown: string) {
  return markdown.replace(/\\\[\\\[([^\n]*?)\\\]\\\]/g, "[[$1]]");
}

export function isLikelyMarkdown(value: string) {
  const text = value.trim();
  if (!text) return false;

  return [
    /^#{1,6}\s+\S/m,
    /^>\s+\S/m,
    /^[-*+]\s+\S/m,
    /^\d+\.\s+\S/m,
    /^[-*+]\s+\[( |x|X)\]\s+\S/m,
    /^```[\s\S]*```/m,
    /^\|.+\|\n\|[-:\s|]+\|/m,
    /\[[^\]]+\]\([^)]+\)/,
    /(^|\s)(\*\*|__)[^\n]+(\*\*|__)(\s|$)/,
  ].some((pattern) => pattern.test(text));
}
