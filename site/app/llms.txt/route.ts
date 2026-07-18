import { GITHUB, VERSION } from "@/lib/config";
import { GUIDES } from "@/lib/guides";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export function GET(): Response {
  const guides = GUIDES.map(
    (guide) => `- [${guide.title}](${SITE_URL}/guides/${guide.slug}): ${guide.description}`,
  ).join("\n");
  const body = `# Markd

> ${SITE_DESCRIPTION}

Markd ${VERSION} is a local-first desktop notes application. Notes are stored as plain Markdown files in a user-selected folder. The desktop app is free and open source under the MIT license. Markd Cloud is an optional paid service for publishing linked notes and hosted images.

## Canonical pages

- [Home](${SITE_URL}/): Product overview and features
- [Download](${SITE_URL}/download): Supported macOS and Linux packages
- [Cloud pricing](${SITE_URL}/pricing): Current publishing subscription prices
- [Changelog](${SITE_URL}/changelog): Versioned release history
- [Source code](${GITHUB}): Public repository and license

## Product guides

${guides}

## Verified product facts

- Storage: plain .md files and real folders selected by the user
- Desktop platforms: Apple Silicon macOS 12 or newer; GNU/Linux x86_64
- Linux formats: AppImage and Debian package
- Editing: rich-text Markdown editor and editable Markdown source mode
- Organization: search, tabs, backlinks, note links, properties, todos, bookmarks, and pinned items
- Publishing: optional Markd Cloud subscription; local editing does not require an account
- AI agent: announced as coming soon, not a currently shipped desktop feature
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
