import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { GUIDES } from "@/lib/guides";
import { absoluteUrl, jsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Markdown notes guides",
  description:
    "Practical guides to local-first notes, plain-text Markdown, Markd on macOS and Linux, and working with an existing vault.",
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "Markdown notes guides | Markd",
    description:
      "Practical guidance for building a portable, local-first Markdown notes workflow.",
    url: "/guides",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Markd Markdown notes guides",
  description: metadata.description,
  url: absoluteUrl("/guides"),
  mainEntity: {
    "@type": "ItemList",
    itemListElement: GUIDES.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: guide.title,
      url: absoluteUrl(`/guides/${guide.slug}`),
    })),
  },
};

export default function GuidesPage() {
  return (
    <>
      <Nav />
      <main className="px-5 pb-20 pt-36 sm:px-8 sm:pt-44">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }}
        />
        <section className="mx-auto w-full max-w-5xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
            Guides
          </p>
          <h1 className="mt-5 max-w-3xl text-balance font-serif text-[48px] leading-[0.98] tracking-[-0.035em] text-foreground sm:text-[70px]">
            Build a notes system you can keep.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-[15px] leading-7 text-muted-foreground">
            Practical explanations of local-first writing, portable Markdown,
            supported platforms, and working with an existing vault.
          </p>
        </section>

        <section className="mx-auto mt-16 grid w-full max-w-5xl gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
          {GUIDES.map((guide, index) => (
            <a
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group flex min-h-52 flex-col bg-background p-6 transition-colors hover:bg-card sm:p-7"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  {String(index + 1).padStart(2, "0")} · {guide.eyebrow}
                </span>
                <ArrowUpRight className="size-4 text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <h2 className="mt-8 text-balance font-serif text-[25px] leading-tight text-foreground">
                {guide.title}
              </h2>
              <p className="mt-3 text-pretty text-[13.5px] leading-6 text-muted-foreground">
                {guide.description}
              </p>
            </a>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
