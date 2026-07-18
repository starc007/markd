import { GITHUB, VERSION } from "@/lib/config";

export const SITE_URL = "https://usemarkd.app";
export const SITE_NAME = "Markd";
export const SITE_TITLE = "Markd: local-first Markdown notes for macOS and Linux";
export const SITE_DESCRIPTION =
  "A fast, local-first Markdown notes app for macOS and Linux. Keep plain .md files in folders you own, with rich editing, backlinks, search, and optional publishing.";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export const PRODUCT_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl("/icon.svg"),
      sameAs: [GITHUB],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Markdown editor and notes app",
      operatingSystem: "macOS 12 or newer; GNU/Linux x86_64",
      softwareVersion: VERSION,
      downloadUrl: absoluteUrl("/download"),
      releaseNotes: absoluteUrl("/changelog"),
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        category: "Free desktop application",
      },
      featureList: [
        "Plain Markdown files in user-selected folders",
        "Rich-text and Markdown source editing",
        "Backlinks and internal note links",
        "Full-text search",
        "Frontmatter property editing",
        "Optional web publishing",
      ],
    },
  ],
};
