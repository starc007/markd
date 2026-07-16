import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  return (
    <div className="published-note">
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
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
