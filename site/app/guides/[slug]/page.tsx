import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { ButtonLink } from "@/components/ui/button";
import { GITHUB } from "@/lib/config";
import { GUIDES, guideBySlug } from "@/lib/guides";
import { absoluteUrl, jsonLd } from "@/lib/seo";

type GuidePageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const guide = guideBySlug((await params).slug);
  if (!guide) return {};

  const path = `/guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: path,
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
    },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const guide = guideBySlug((await params).slug);
  if (!guide) notFound();

  const url = absoluteUrl(`/guides/${guide.slug}`);
  const related = GUIDES.filter((item) => item.slug !== guide.slug).slice(0, 3);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        datePublished: guide.publishedAt,
        dateModified: guide.updatedAt,
        mainEntityOfPage: url,
        author: { "@type": "Organization", name: "Markd", url: absoluteUrl() },
        publisher: { "@id": `${absoluteUrl()}#organization` },
        about: { "@id": `${absoluteUrl()}#software` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl() },
          { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/guides") },
          { "@type": "ListItem", position: 3, name: guide.shortTitle, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <Nav />
      <main className="px-5 pb-20 pt-32 sm:px-8 sm:pt-40">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
        />
        <article className="mx-auto w-full max-w-3xl">
          <a
            href="/guides"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            All guides
          </a>

          <header className="mt-9 border-b border-border pb-10">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
              {guide.eyebrow}
            </p>
            <h1 className="mt-4 text-balance font-serif text-[44px] leading-[1.02] tracking-[-0.035em] text-foreground sm:text-[62px]">
              {guide.title}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-[16px] leading-7 text-muted-foreground">
              {guide.description}
            </p>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
              Updated {new Date(`${guide.updatedAt}T00:00:00Z`).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              })}
            </p>
          </header>

          <aside className="my-10 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-[13px] font-semibold text-foreground">At a glance</h2>
            <ul className="mt-4 space-y-3">
              {guide.takeaways.map((takeaway) => (
                <li key={takeaway} className="flex items-start gap-2.5 text-[14px] leading-6 text-fg-soft">
                  <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-accent-soft">
                    <Check className="size-2.5" strokeWidth={2.5} aria-hidden />
                  </span>
                  {takeaway}
                </li>
              ))}
            </ul>
          </aside>

          <div className="space-y-12">
            {guide.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-balance font-serif text-[29px] leading-tight text-foreground">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4 text-pretty text-[15px] leading-7 text-fg-soft">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-14 border-t border-border pt-10">
            <h2 className="font-serif text-[29px] text-foreground">Common questions</h2>
            <div className="mt-6 divide-y divide-border border-y border-border">
              {guide.faqs.map((faq) => (
                <div key={faq.question} className="py-5">
                  <h3 className="text-[15px] font-semibold text-foreground">{faq.question}</h3>
                  <p className="mt-2 text-pretty text-[14px] leading-6 text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14 rounded-2xl border border-border p-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div>
              <h2 className="font-serif text-[26px] text-foreground">Try Markd with your files.</h2>
              <p className="mt-2 text-[13.5px] leading-6 text-muted-foreground">
                Free, open source, and built around portable Markdown.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
              <ButtonLink href="/download" size="sm">Download Markd</ButtonLink>
              <ButtonLink href={GITHUB} target="_blank" rel="noreferrer" size="sm" variant="outline">
                Source <ArrowUpRight className="size-3.5" aria-hidden />
              </ButtonLink>
            </div>
          </section>

          <section className="mt-14">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Related guides</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {related.map((item) => (
                <a
                  key={item.slug}
                  href={`/guides/${item.slug}`}
                  className="rounded-xl border border-border p-4 text-[13px] font-medium leading-5 text-fg-soft transition-colors hover:bg-card hover:text-foreground"
                >
                  {item.shortTitle}
                </a>
              ))}
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
