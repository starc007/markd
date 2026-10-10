import { splitFrontmatter } from "./frontmatter";

/**
 * Strips common Markdown formatting syntax so words inside prose are counted
 * without syntax tokens (like headings `#`, bullets `-`, bold/italic `**`, etc.)
 * inflating the word count.
 */
export function stripMarkdownSyntax(markdown: string): string {
  return (
    markdown
      // Code fence markers
      .replace(/^```[a-zA-Z0-9_-]*\s*$/gm, "")
      // Headings (including those nested inside blockquotes)
      .replace(/^(?:(?:\s*>\s*)+)?#{1,6}\s+/gm, "")
      // Blockquotes (including nested e.g. >>, > >)
      .replace(/^(?:\s*>\s*)+/gm, "")
      // Unordered and task lists
      .replace(/^(\s*[-*+]\s*(\[[ xX]\]\s*)?)/gm, "")
      // Ordered lists
      .replace(/^(\s*\d+\.\s*)/gm, "")
      // Wiki links [[note|alias]] -> alias, [[note]] -> note (must precede table pipe replacement)
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1")
      // Images ![alt](url) -> alt
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Markdown links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      // Table delimiter rows (e.g. | --- | :---: | ---: |)
      .replace(/^[\s|:-]+$/gm, "")
      // Table pipe delimiters -> replace with space so column boundaries separate words
      .replace(/\|/g, " ")
      // Horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // Inline code `code` -> code
      .replace(/`([^`]+)`/g, "$1")
      // Bold, italic, strikethrough: **text**, *text*, __text__, _text_, ~~text~~
      .replace(/(\*\*|__|\*|_|~~)(.*?)\1/g, "$2")
  );
}

/**
 * Counts words in a plain or rendered text string by whitespace.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
}

/**
 * Counts prose words in a raw markdown string, ignoring Markdown syntax formatting.
 */
export function countMarkdownWords(markdown: string): number {
  return countWords(stripMarkdownSyntax(markdown));
}

/**
 * Given the entire raw markdown note and a selection range [from, to],
 * extracts only the selected text portion that falls within the note's body,
 * excluding any frontmatter block.
 */
export function extractBodySelection(
  rawText: string,
  from: number,
  to: number,
): string {
  if (from >= to) return "";
  const { frontmatter } = splitFrontmatter(rawText);
  const bodyStart = frontmatter.length;

  // Selection is entirely within frontmatter
  if (to <= bodyStart) return "";

  // Selection starts inside frontmatter but extends into body
  const effectiveFrom = Math.max(from, bodyStart);
  return rawText.slice(effectiveFrom, to);
}
