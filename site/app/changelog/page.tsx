import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ChangelogEntry } from "@/components/changelog/ChangelogEntry";
import { CHANGELOG } from "@/lib/changelog";
import { GITHUB } from "@/lib/config";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "See what is new in Markd, the local-first Markdown notes app for macOS and Linux.",
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    title: "Markd changelog",
    description: "New features, refinements, and fixes in every Markd release.",
    url: "/changelog",
  },
};

export default function ChangelogPage() {
  return (
    <>
      <Nav />
      <main className="px-5 pb-20 pt-36 sm:px-8 sm:pt-44">
        <section className="mx-auto w-full max-w-5xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
            Changelog
          </p>
          <div className="mt-5 grid gap-6 sm:grid-cols-[1fr_18rem] sm:items-end sm:gap-12">
            <h1 className="max-w-2xl text-balance font-serif text-[48px] leading-[0.98] tracking-[-0.035em] text-foreground sm:text-[72px]">
              What&apos;s new in Markd.
            </h1>
            <p className="max-w-sm text-pretty text-[15px] leading-7 text-muted-foreground sm:pb-1">
              New features, thoughtful refinements, and the fixes that make
              writing feel a little quieter.
            </p>
          </div>
        </section>

        <section
          aria-label="Markd releases"
          className="mx-auto mt-20 w-full max-w-5xl sm:mt-28"
        >
          {CHANGELOG.map((entry, index) => (
            <ChangelogEntry
              key={entry.version}
              entry={entry}
              latest={index === 0}
            />
          ))}
        </section>

        <section className="mx-auto mt-6 w-full max-w-5xl border-t border-border pt-10 sm:grid sm:grid-cols-[9rem_1fr] sm:gap-10 sm:pt-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
            Follow along
          </p>
          <div className="mt-4 max-w-2xl sm:mt-0">
            <p className="font-serif text-[25px] leading-tight text-foreground">
              Markd is built in the open.
            </p>
            <p className="mt-3 max-w-lg text-[14px] leading-6 text-muted-foreground">
              Browse the source, report an issue, or see the full release
              archive on GitHub.
            </p>
            <a
              href={`${GITHUB}/releases`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground transition-opacity hover:opacity-60"
            >
              All releases
              <ArrowUpRight className="size-3.5" strokeWidth={1.8} />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
