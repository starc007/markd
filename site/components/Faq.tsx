import { Plus } from "lucide-react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Where are my notes stored?",
    a: "On your Mac, as plain Markdown files in a folder you choose. No database, no cloud, no account — open the folder in Finder anytime. The app sends nothing anywhere.",
  },
  {
    q: "Is there sync?",
    a: "Not built in yet. Because notes are just files in a folder, you can sync them today with iCloud Drive, Dropbox, or git. Native sync is on the roadmap.",
  },
  {
    q: "Does it work with Obsidian?",
    a: "Yes. Markd uses the same plain-Markdown vault with real folders, and preserves frontmatter from other tools. Point Markd and Obsidian at the same folder and both just work.",
  },
  {
    q: "Is the macOS download verified?",
    a: "Yes. Every Markd release is signed with a Developer ID certificate and notarized by Apple before distribution.",
  },
  {
    q: "Is it free?",
    a: "Yes — free and open source under the MIT license. No subscription, no upsell.",
  },
  {
    q: "Windows or Linux?",
    a: "macOS first. Markd is built on Tauri, which is cross-platform, so other platforms may follow — but macOS is where it's polished today.",
  },
  {
    q: "What's the AI agent?",
    a: "Coming soon: an agent that reads and writes your vault with your review on every edit, powered by your existing Claude subscription — no API keys, nothing leaves your Mac.",
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export function Faq() {
  return (
    <section id="faq" className="w-full scroll-mt-24 px-4 py-24 sm:px-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <div className="mx-auto w-full max-w-3xl">
        <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 font-medium text-[12px] text-muted-foreground">
          FAQ
        </span>
        <h2 className="mt-5 text-balance font-serif text-[32px] leading-[1.1] text-foreground sm:text-[42px]">
          Questions, answered.
        </h2>

        <div className="mt-10 border-t border-border">
          {FAQS.map((f) => (
            <details key={f.q} className="group border-b border-border py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-medium text-foreground">
                {f.q}
                <Plus
                  className="size-4 shrink-0 text-faint transition-transform duration-200 group-open:rotate-45"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 max-w-2xl text-pretty text-[14.5px] leading-7 text-muted-foreground">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
