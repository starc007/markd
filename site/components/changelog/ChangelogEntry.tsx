import { ArrowUpRight } from "lucide-react";
import type { ChangelogEntry as ChangelogEntryData } from "@/lib/changelog";

export function ChangelogEntry({
  entry,
  latest = false,
}: {
  entry: ChangelogEntryData;
  latest?: boolean;
}) {
  return (
    <article className="grid gap-5 border-t border-border py-10 sm:grid-cols-[9rem_1fr] sm:gap-10 sm:py-14">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[12px] font-medium text-foreground">
            v{entry.version}
          </span>
          {latest ? (
            <span className="relative isolate inline-flex h-5 items-center gap-1.5 overflow-hidden rounded-full bg-[linear-gradient(105deg,#bd7a31_0%,#c64f5d_100%)] px-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-white shadow-[0_2px_10px_rgba(198,79,93,0.22)]">
              <span
                aria-hidden="true"
                className="size-1 rounded-full bg-white/90 shadow-[0_0_5px_rgba(255,255,255,0.7)]"
              />
              <span className="relative">Latest</span>
            </span>
          ) : null}
        </div>
        <time
          dateTime={entry.date}
          className="mt-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-faint"
        >
          {entry.displayDate}
        </time>
      </div>

      <div className="max-w-2xl">
        <h2 className="font-serif text-[28px] leading-[1.1] tracking-[-0.02em] text-foreground sm:text-[34px]">
          {entry.title}
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-muted-foreground">
          {entry.summary}
        </p>

        <ul className="mt-7 space-y-3">
          {entry.changes.map((change) => (
            <li
              key={change}
              className="flex gap-3 text-[14px] leading-6 text-fg-soft"
            >
              <span
                aria-hidden="true"
                className="mt-[0.68rem] size-1 shrink-0 rounded-full bg-faint"
              />
              <span>{change}</span>
            </li>
          ))}
        </ul>

        {entry.releaseUrl ? (
          <a
            href={entry.releaseUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground transition-opacity hover:opacity-60"
          >
            View release
            <ArrowUpRight className="size-3.5" strokeWidth={1.8} />
          </a>
        ) : null}
      </div>
    </article>
  );
}
