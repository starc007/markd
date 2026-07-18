import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublishedHeaderActions } from "@/components/published/PublishedHeaderActions";
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
      <header className="fixed top-0 z-20 w-full border-b border-border/20 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-11 w-full items-center gap-3 px-3">
          <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground">
            {note.title}
          </p>
          <PublishedHeaderActions title={note.title} />
        </div>
      </header>

      <article className="mx-auto w-full max-w-2xl px-5 pb-24 pt-28 sm:px-0">
        <div className="mb-10 pb-7">
          <h1 className="text-balance text-[30px] font-[680] leading-[1.15] tracking-[-0.018em] sm:text-[34px]">
            {note.title}
          </h1>
        </div>

        <PublishedMarkdown markdown={note.markdown} />
      </article>

      <footer className="mx-auto flex w-full max-w-3xl items-center justify-center px-5 py-4 text-[11.5px] text-faint sm:px-0">
        <span>Published with   <a
          href="/"
          className="rounded-sm transition-colors text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          Markd
        </a></span>

      </footer>
    </main>
  );
}
