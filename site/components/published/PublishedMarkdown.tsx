import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  publishedProperties,
  splitPublishedFrontmatter,
} from "@/lib/published-note";

function isSafeLink(href: string | undefined): boolean {
  if (!href) return false;
  return href.startsWith("#") || /^(https?:|mailto:)/i.test(href);
}

function PublishedLink({ href, children, ...props }: ComponentPropsWithoutRef<"a">) {
  if (!isSafeLink(href)) return <span>{children}</span>;
  const external = /^https?:/i.test(href ?? "");
  return (
    <a
      {...props}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
    >
      {children}
    </a>
  );
}

export function PublishedMarkdown({ markdown }: { markdown: string }) {
  const { body } = splitPublishedFrontmatter(markdown);
  const properties = publishedProperties(markdown);

  return (
    <div className="published-note">
      {properties.length > 0 ? <PublishedProperties properties={properties} /> : null}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: PublishedLink,
          img: ({ alt }) => (
            <span className="published-note__asset-placeholder">
              {alt || "Image attachment"}
            </span>
          ),
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
