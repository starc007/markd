/**
 * Internal page links are stored as ordinary markdown links whose href is a
 * vault-relative note path, e.g. `[Roadmap](projects/roadmap.md)`. That keeps
 * the files plain-markdown and portable while letting the app resolve clicks
 * to open the target note.
 */

/** True if `href` points outside the vault (has a scheme) or is an anchor. */
function isExternal(href: string) {
  return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#");
}

/**
 * Resolve a link href to a vault note rel, or null if it isn't an internal
 * note link. Accepts `projects/app.md`, `./app.md`, `/app.md`, `app` (no ext).
 */
export function hrefToRel(href: string | null | undefined): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed || isExternal(trimmed)) return null;
  let rel = decodeURI(trimmed).split(/[?#]/)[0].replace(/^\.?\//, "");
  if (!rel) return null;
  if (!/\.md$/i.test(rel)) rel += ".md";
  return rel;
}

/** Vault rel → link href (path segments percent-encoded so spaces stay valid). */
export function relToHref(rel: string): string {
  return rel.split("/").map(encodeURIComponent).join("/");
}

/**
 * Resolve a `[[wiki]]` target to a note. Matches by full rel first, then by
 * bare filename anywhere in the vault (Obsidian-style); falls back to a
 * root-level path if nothing matches, so the link still points somewhere sane.
 */
export function resolveWiki(
  target: string,
  notes: { rel: string }[],
): { rel: string; title: string } {
  const clean = target.trim().replace(/\.md$/i, "");
  const lower = clean.toLowerCase();
  const byRel = notes.find(
    (n) => n.rel.replace(/\.md$/i, "").toLowerCase() === lower,
  );
  const byName = byRel
    ? undefined
    : notes.find(
        (n) =>
          (n.rel.split("/").pop() ?? "").replace(/\.md$/i, "").toLowerCase() ===
          lower,
      );
  const rel = (byRel ?? byName)?.rel ?? `${clean}.md`;
  const title = (rel.split("/").pop() ?? rel).replace(/\.md$/i, "");
  return { rel, title };
}

/**
 * Rewrite `[[target]]` / `[[target|alias]]` wiki links in a markdown string
 * into standard markdown links, resolving targets against `notes`. Keeps files
 * plain-markdown while letting Obsidian-style syntax render as page links.
 */
export function wikiToMarkdown(
  markdown: string,
  notes: { rel: string }[],
): string {
  return markdown.replace(
    /\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]/g,
    (_, target: string, alias?: string) => {
      const { rel, title } = resolveWiki(target, notes);
      const text = (alias ?? title).trim();
      return `[${text}](${relToHref(rel)})`;
    },
  );
}
