/**
 * YAML frontmatter handling. Frontmatter stays outside the rich editor and is
 * re-attached on save. UI property edits only touch the selected flat property
 * so comments and unsupported YAML structures continue to round-trip.
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

export type PropertyType =
  | "text"
  | "number"
  | "checkbox"
  | "date"
  | "url"
  | "list";

export interface Property {
  key: string;
  value: string | string[] | number | boolean;
}

export function propertyType(value: Property["value"]): PropertyType {
  if (Array.isArray(value)) return "list";
  if (typeof value === "boolean") return "checkbox";
  if (typeof value === "number") return "number";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "date";
  if (/^https?:\/\//i.test(value)) return "url";
  return "text";
}

function unquote(raw: string): string {
  const value = raw.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value) as string;
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  return value.replace(/^\[\[|\]\]$/g, "").trim();
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
    if (scalar === "[]") {
      props.push({ key, value: [] });
      i += 1;
      continue;
    }
    if (scalar === "true" || scalar === "false") {
      props.push({ key, value: scalar === "true" });
      i += 1;
      continue;
    }
    if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(scalar)) {
      props.push({ key, value: Number(scalar) });
      i += 1;
      continue;
    }
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

const PROPERTY_KEY_RE = /^[A-Za-z0-9_][\w -]*$/;

export function isValidPropertyKey(key: string): boolean {
  return PROPERTY_KEY_RE.test(key.trim());
}

function propertyLines(property: Property): string[] {
  const key = property.key.trim();
  if (Array.isArray(property.value)) {
    if (property.value.length === 0) return [`${key}: []`];
    return [
      `${key}:`,
      ...property.value.map((item) => `  - ${JSON.stringify(item)}`),
    ];
  }
  if (typeof property.value === "number" || typeof property.value === "boolean") {
    return [`${key}: ${String(property.value)}`];
  }
  return [`${key}: ${JSON.stringify(property.value)}`];
}

function propertyRange(lines: string[], key: string, closing: number) {
  for (let start = 1; start < closing; start += 1) {
    const match = /^([A-Za-z0-9_][\w -]*?):[ \t]*(.*)$/.exec(lines[start]);
    if (!match || match[1].trim() !== key) continue;
    let end = start + 1;
    while (end < closing && /^[ \t]*-[ \t]+/.test(lines[end])) end += 1;
    return { start, end };
  }
  return null;
}

function closingDelimiterIndex(lines: string[]): number {
  for (let index = lines.length - 1; index > 0; index -= 1) {
    if (lines[index].trim() === "---") return index;
  }
  return -1;
}

/** Add or replace one flat property without reserializing the full YAML block. */
export function upsertFrontmatterProperty(
  frontmatter: string,
  previousKey: string | null,
  property: Property,
): string {
  const next = { ...property, key: property.key.trim() };
  if (!isValidPropertyKey(next.key)) return frontmatter;

  if (!frontmatter) {
    return ["---", ...propertyLines(next), "---", ""].join("\n");
  }

  const newline = frontmatter.includes("\r\n") ? "\r\n" : "\n";
  const lines = frontmatter.split(/\r?\n/);
  const closing = closingDelimiterIndex(lines);
  if (closing < 0) return frontmatter;

  const range = propertyRange(lines, previousKey ?? next.key, closing);
  if (range) {
    lines.splice(range.start, range.end - range.start, ...propertyLines(next));
  } else {
    lines.splice(closing, 0, ...propertyLines(next));
  }
  return lines.join(newline);
}

/** Remove one flat property while leaving unrelated YAML untouched. */
export function removeFrontmatterProperty(
  frontmatter: string,
  key: string,
): string {
  if (!frontmatter) return "";
  const newline = frontmatter.includes("\r\n") ? "\r\n" : "\n";
  const lines = frontmatter.split(/\r?\n/);
  const closing = closingDelimiterIndex(lines);
  if (closing < 0) return frontmatter;
  const range = propertyRange(lines, key, closing);
  if (!range) return frontmatter;

  lines.splice(range.start, range.end - range.start);
  const nextClosing = closingDelimiterIndex(lines);
  const isEmpty = lines
    .slice(1, nextClosing)
    .every((line) => line.trim().length === 0);
  return isEmpty ? "" : lines.join(newline);
}
