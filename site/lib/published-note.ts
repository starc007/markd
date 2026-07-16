import { cache } from "react";

export interface PublishedNote {
  title: string;
  markdown: string;
  publishedAt: number;
  updatedAt: number;
}

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
  );
}

export const getPublishedNote = cache(
  async (slug: string): Promise<PublishedNote | null> => {
    const response = await fetch(
      `${apiOrigin()}/v1/public/shares/${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
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
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}
