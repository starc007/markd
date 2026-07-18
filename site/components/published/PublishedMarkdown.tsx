import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  publishedProperties,
  splitPublishedFrontmatter,
} from "@/lib/published-note";

function isSafeLink(href: string | undefined): boolean {
  if (!href) return false;
  return href.startsWith("#") || href.startsWith("markd-page:") || /^(https?:|mailto:)/i.test(href);
}

function PublishedLink({
  href,
  siteSlug,
  children,
  ...props
}: ComponentPropsWithoutRef<"a"> & { siteSlug: string }) {
  if (!isSafeLink(href)) return <span>{children}</span>;
  const pagePath = href?.startsWith("markd-page:")
    ? href.slice("markd-page:".length)
    : null;
  const safeHref =
    pagePath === null
      ? href
      : pagePath
        ? `/s/${encodeURIComponent(siteSlug)}/${pagePath}`
        : `/s/${encodeURIComponent(siteSlug)}`;
  const external = /^https?:/i.test(href ?? "");
  return (
    <a
      {...props}
      href={safeHref}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
    >
      {children}
    </a>
  );
}

export function PublishedMarkdown({
  markdown,
  siteSlug,
  assetBaseUrl,
  assetTypes,
  assetDimensions,
}: {
  markdown: string;
  siteSlug: string;
  assetBaseUrl: string;
  assetTypes: Record<string, string>;
  assetDimensions: Record<string, { width: number; height: number }>;
}) {
  const { body } = splitPublishedFrontmatter(markdown);
  const properties = publishedProperties(markdown);

  return (
    <div className="published-note">
      {properties.length > 0 ? <PublishedProperties properties={properties} /> : null}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url) =>
          typeof url === "string" &&
          (url.startsWith("markd-asset:") || url.startsWith("markd-page:"))
            ? url
            : defaultUrlTransform(url)
        }
        components={{
          a: (props) => <PublishedLink {...props} siteSlug={siteSlug} />,
          img: ({ alt, src }) => {
            const hash = typeof src === "string" && src.startsWith("markd-asset:")
              ? src.slice("markd-asset:".length)
              : null;
            if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
              return (
                <span className="published-note__asset-placeholder">
                  {alt || "Image attachment"}
                </span>
              );
            }
            const widths = [320, 640, 960, 1280, 1600];
            const sizes = "(max-width: 720px) calc(100vw - 40px), 672px";
            const dimensions = assetDimensions[hash];
            if (assetTypes[hash] === "image/gif") {
              return (
                <img
                  src={`${assetBaseUrl}/${hash}`}
                  alt={alt ?? ""}
                  width={dimensions?.width}
                  height={dimensions?.height}
                  loading="lazy"
                  decoding="async"
                />
              );
            }
            return (
              <picture>
                <source
                  type="image/avif"
                  srcSet={widths
                    .map((width) => `${assetBaseUrl}/${hash}?w=${width}&f=avif ${width}w`)
                    .join(", ")}
                  sizes={sizes}
                />
                <source
                  type="image/webp"
                  srcSet={widths
                    .map((width) => `${assetBaseUrl}/${hash}?w=${width}&f=webp ${width}w`)
                    .join(", ")}
                  sizes={sizes}
                />
                <img
                  src={`${assetBaseUrl}/${hash}`}
                  alt={alt ?? ""}
                  width={dimensions?.width}
                  height={dimensions?.height}
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            );
          },
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}

function PublishedProperties({
  properties,
}: {
  properties: ReturnType<typeof publishedProperties>;
}) {
  return (
    <dl className="mb-8 grid gap-2 border-b border-border pb-6 text-[13px]">
      {properties.map((property) => (
        <div key={property.key} className="grid gap-1.5 sm:grid-cols-[120px_1fr]">
          <dt className="font-medium capitalize text-faint">{property.key}</dt>
          <dd className="text-muted-foreground">
            {Array.isArray(property.value) ? (
              <span className="flex flex-wrap gap-1.5">
                {property.value.map((item) => (
                  <span
                    key={item}
                    className="rounded-md bg-panel px-2 py-0.5 text-[12px] text-foreground"
                  >
                    {item}
                  </span>
                ))}
              </span>
            ) : (
              property.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
