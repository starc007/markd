import type { ComponentPropsWithoutRef } from "react";
import {
  CalendarDays,
  CaseSensitive,
  Check,
  CheckSquare,
  ExternalLink,
  Hash,
  Link2,
  List,
  type LucideIcon,
} from "lucide-react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  type PublishedProperty,
  type PublishedPropertyType,
  publishedProperties,
  publishedPropertyType,
  splitPublishedFrontmatter,
} from "@/lib/published-note";

const PROPERTY_ICONS: Record<PublishedPropertyType, LucideIcon> = {
  text: CaseSensitive,
  number: Hash,
  checkbox: CheckSquare,
  date: CalendarDays,
  url: Link2,
  list: List,
};

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
            const widths = [480, 960, 1440];
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
                  type="image/webp"
                  srcSet={widths
                    .map((width) => `${assetBaseUrl}/${hash}?w=${width} ${width}w`)
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
        <div
          key={property.key}
          className="grid min-h-7 items-start gap-1.5 sm:grid-cols-[140px_1fr]"
        >
          <dt className="flex items-center gap-2 font-medium capitalize text-faint">
            {(() => {
              const Icon = PROPERTY_ICONS[publishedPropertyType(property.value)];
              return <Icon size={13} strokeWidth={1.8} aria-hidden="true" />;
            })()}
            <span className="truncate">{property.key}</span>
          </dt>
          <dd className="min-w-0 text-muted-foreground">
            <PublishedPropertyValue property={property} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PublishedPropertyValue({
  property,
}: {
  property: PublishedProperty;
}) {
  const { value } = property;
  const type = publishedPropertyType(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-faint">Empty</span>;
    return (
      <span className="flex flex-wrap gap-1.5">
        {value.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="rounded-md bg-panel px-2 py-0.5 text-[12px] text-foreground"
          >
            {item}
          </span>
        ))}
      </span>
    );
  }

  if (type === "checkbox") {
    return (
      <span className="flex items-center gap-2">
        <span className="grid h-4 w-4 place-items-center rounded border border-border bg-panel">
          <Check
            size={11}
            strokeWidth={2.5}
            className={value ? "opacity-100" : "opacity-0"}
          />
        </span>
        {value ? "Checked" : "Unchecked"}
      </span>
    );
  }

  if (type === "url" && typeof value === "string") {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex max-w-full items-center gap-1.5"
      >
        <span className="truncate">{value}</span>
        <ExternalLink size={12} strokeWidth={1.8} className="shrink-0" />
      </a>
    );
  }

  if (type === "date" && typeof value === "string") {
    return <time dateTime={value}>{value}</time>;
  }

  if (type === "number") {
    return <span className="tabular-nums">{value}</span>;
  }

  return <>{String(value)}</>;
}
