/**
 * YAML frontmatter handling. The app never authors frontmatter, but notes
 * clipped from external tools carry a leading `---` block. We split it off so
 * the editor shows only the body, then re-attach it verbatim on save — the file
 * keeps its metadata, the editor stays clean.
 */

// Leading `---\n … \n---` block at the very start of the document.
const FRONTMATTER_RE = /^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;

export interface SplitNote {
  /** Raw frontmatter incl. delimiters and trailing newline, or "" if none. */
  frontmatter: string;
  /** Everything after the frontmatter block. */
  body: string;
}

export function splitFrontmatter(markdown: string): SplitNote {
  const match = FRONTMATTER_RE.exec(markdown);
  if (!match) return { frontmatter: "", body: markdown };
  return {
    frontmatter: match[0],
    body: markdown.slice(match[0].length),
  };
}

/** Re-attach frontmatter to an edited body (inverse of splitFrontmatter). */
export function joinFrontmatter(frontmatter: string, body: string): string {
  return frontmatter + body;
}

export interface Property {
  key: string;
  value: string | string[];
}

function unquote(raw: string): string {
  return raw
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^\[\[|\]\]$/g, "")
    .trim();
}

/**
 * Minimal YAML-frontmatter reader — enough for the flat maps that clipping
 * tools emit: `key: value` scalars and `key:` followed by `- item` lists.
 * Not a general YAML parser; nested maps and block scalars are ignored.
 */
export function parseFrontmatter(frontmatter: string): Property[] {
  if (!frontmatter) return [];
  const inner = frontmatter
    .replace(/^---[ \t]*\r?\n/, "")
    .replace(/\r?\n---[ \t]*\r?\n?$/, "");
  const lines = inner.split(/\r?\n/);
  const props: Property[] = [];

  for (let i = 0; i < lines.length; ) {
    const match = /^([A-Za-z0-9_][\w -]*?):[ \t]*(.*)$/.exec(lines[i]);
    if (!match) {
      i += 1;
      continue;
    }
    const key = match[1].trim();
    const scalar = match[2].trim();
    if (scalar) {
      props.push({ key, value: unquote(scalar) });
      i += 1;
      continue;
    }
    // No inline value — collect any following `- item` list lines.
    const items: string[] = [];
    let j = i + 1;
    while (j < lines.length && /^[ \t]*-[ \t]+/.test(lines[j])) {
      items.push(unquote(lines[j].replace(/^[ \t]*-[ \t]+/, "")));
      j += 1;
    }
    if (items.length) {
      props.push({ key, value: items });
      i = j;
    } else {
      i += 1;
    }
  }
  return props;
}
