import { cache } from "react";

export interface PublishedNote {
  title: string;
  markdown: string;
  publishedAt: number;
  updatedAt: number;
  assetBaseUrl: string;
  assetTypes: Record<string, string>;
  assetDimensions: Record<string, { width: number; height: number }>;
}

export interface PublishedProperty {
  key: string;
  value: string | string[];
}

const FRONTMATTER_RE = /^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;

function apiOrigin(): string {
  const origin = process.env.MARKD_CLOUD_API_URL;
  if (!origin) {
    throw new Error("MARKD_CLOUD_API_URL is not configured");
  }
  return origin.replace(/\/$/, "");
}

function isPublishedNote(value: unknown): value is PublishedNote {
  if (!value || typeof value !== "object") return false;
  const note = value as Record<string, unknown>;
  return (
    typeof note.title === "string" &&
    typeof note.markdown === "string" &&
    typeof note.publishedAt === "number" &&
    typeof note.updatedAt === "number"
    && typeof note.assetBaseUrl === "string" && isStringRecord(note.assetTypes)
    && isDimensionRecord(note.assetDimensions)
  );
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return Boolean(value) && typeof value === "object"
    && Object.values(value as Record<string, unknown>).every((item) => typeof item === "string");
}

function isDimensionRecord(
  value: unknown,
): value is Record<string, { width: number; height: number }> {
  return Boolean(value) && typeof value === "object"
    && Object.values(value as Record<string, unknown>).every((item) => {
      if (!item || typeof item !== "object") return false;
      const dimension = item as Record<string, unknown>;
      return typeof dimension.width === "number" && typeof dimension.height === "number";
    });
}

export const getPublishedNote = cache(
  async (slug: string, path?: string): Promise<PublishedNote | null> => {
    const pagePath = path
      ? `/pages/${path.split("/").map(encodeURIComponent).join("/")}`
      : "";
    const response = await fetch(
      `${apiOrigin()}/v1/public/sites/${encodeURIComponent(slug)}${pagePath}`,
      {
        next: { revalidate: 300, tags: [`markd-slug-${slug}`] },
        headers: { accept: "application/json" },
      },
    );
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Publishing API returned ${response.status}`);
    }
    const body: unknown = await response.json();
    if (!isPublishedNote(body)) {
      throw new Error("Publishing API returned an invalid note");
    }
    return body;
  },
);

export function noteDescription(markdown: string): string {
  return splitPublishedFrontmatter(markdown)
    .body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export function stripPublishedFrontmatter(markdown: string): string {
  return splitPublishedFrontmatter(markdown).body;
}

export function splitPublishedFrontmatter(markdown: string): {
  frontmatter: string;
  body: string;
} {
  const match = FRONTMATTER_RE.exec(markdown);
  if (!match) return { frontmatter: "", body: markdown };
  return {
    frontmatter: match[0],
    body: markdown.slice(match[0].length).replace(/^\r?\n/, ""),
  };
}

export function publishedProperties(markdown: string): PublishedProperty[] {
  return parsePublishedFrontmatter(splitPublishedFrontmatter(markdown).frontmatter);
}

function parsePublishedFrontmatter(frontmatter: string): PublishedProperty[] {
  if (!frontmatter) return [];
  const inner = frontmatter
    .replace(/^---[ \t]*\r?\n/, "")
    .replace(/\r?\n---[ \t]*\r?\n?$/, "");
  const lines = inner.split(/\r?\n/);
  const properties: PublishedProperty[] = [];

  for (let index = 0; index < lines.length; ) {
    const match = /^([A-Za-z0-9_][\w -]*?):[ \t]*(.*)$/.exec(lines[index]);
    if (!match) {
      index += 1;
      continue;
    }

    const key = match[1].trim();
    const scalar = match[2].trim();
    if (scalar) {
      properties.push({ key, value: unquotePropertyValue(scalar) });
      index += 1;
      continue;
    }

    const items: string[] = [];
    let next = index + 1;
    while (next < lines.length && /^[ \t]*-[ \t]+/.test(lines[next])) {
      items.push(
        unquotePropertyValue(lines[next].replace(/^[ \t]*-[ \t]+/, "")),
      );
      next += 1;
    }
    if (items.length) properties.push({ key, value: items });
    index = Math.max(next, index + 1);
  }

  return properties;
}

function unquotePropertyValue(raw: string): string {
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
