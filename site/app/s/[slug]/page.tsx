import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Wordmark } from "@/components/Logo";
import { PublishedMarkdown } from "@/components/published/PublishedMarkdown";
import {
  getPublishedNote,
  noteDescription,
} from "@/lib/published-note";

export const dynamic = "force-dynamic";

interface SharePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { slug } = await params;
  const note = await getPublishedNote(slug);
  if (!note) return { title: "Published note · Markd", robots: { index: false } };

  const description = noteDescription(note.markdown) || "A note published with Markd.";
  return {
    title: `${note.title} · Markd`,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: note.title,
      description,
      type: "article",
      siteName: "Markd",
    },
    twitter: { card: "summary", title: note.title, description },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;
  const note = await getPublishedNote(slug);
  if (!note) notFound();

  const published = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(note.publishedAt));

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex h-20 w-full max-w-[760px] items-center justify-between px-5 sm:px-8">
        <a href="/" aria-label="Markd home" className="press rounded-md">
          <Wordmark size={21} />
        </a>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          Public note
        </span>
      </header>

      <article className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        <div className="mb-12 border-b border-border pb-9">
          <p className="mb-5 font-mono text-[10.5px] uppercase tracking-[0.13em] text-faint">
            Published {published}
          </p>
          <h1 className="max-w-[680px] text-balance font-serif text-[42px] font-medium leading-[1.05] tracking-[-0.035em] sm:text-[58px]">
            {note.title}
          </h1>
        </div>

        <PublishedMarkdown markdown={note.markdown} />
      </article>

      <footer className="mx-auto flex w-full max-w-[760px] items-center justify-between border-t border-border px-5 py-8 text-[11.5px] text-faint sm:px-8">
        <span>Published with Markd</span>
        <a href="/" className="transition-colors hover:text-foreground">
          Local-first Markdown notes
        </a>
      </footer>
    </main>
  );
}
