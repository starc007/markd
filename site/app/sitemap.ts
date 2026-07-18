import type { MetadataRoute } from "next";
import { CHANGELOG } from "@/lib/changelog";
import { GUIDES } from "@/lib/guides";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const latestRelease = new Date(`${CHANGELOG[0].date}T00:00:00Z`);
  const routes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl(),
      lastModified: new Date("2026-07-19T00:00:00Z"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/download"),
      lastModified: latestRelease,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/pricing"),
      lastModified: new Date("2026-07-19T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/changelog"),
      lastModified: latestRelease,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/guides"),
      lastModified: new Date("2026-07-19T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  return routes.concat(
    GUIDES.map((guide) => ({
      url: absoluteUrl(`/guides/${guide.slug}`),
      lastModified: new Date(`${guide.updatedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  );
}
