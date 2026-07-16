import type { ReactNode } from "react";

type PlatformCardProps = {
  index: string;
  icon: ReactNode;
  platform: string;
  architecture: string;
  description: string;
  details: string[];
  children: ReactNode;
};

export function PlatformCard({
  index,
  icon,
  platform,
  architecture,
  description,
  details,
  children,
}: PlatformCardProps) {
  return (
    <article className="flex min-h-[31rem] flex-col rounded-[1.75rem] border border-border bg-paper p-6 shadow-[0_18px_55px_-42px_rgba(25,25,23,0.28)] sm:p-8">
      <div className="flex items-start justify-between">
        <div className="grid size-12 place-items-center rounded-2xl bg-panel text-foreground">
          {icon}
        </div>
        <span className="font-mono text-[10px] tracking-[0.15em] text-faint">
          {index}
        </span>
      </div>

      <div className="mt-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
          {architecture}
        </p>
        <h2 className="mt-3 font-serif text-[38px] leading-none tracking-[-0.025em] text-foreground sm:text-[44px]">
          {platform}
        </h2>
        <p className="mt-5 max-w-sm text-pretty text-[14px] leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <ul className="mt-8 space-y-3 border-t border-border pt-6">
        {details.map((detail) => (
          <li
            key={detail}
            className="flex items-center gap-3 text-[12.5px] text-muted-foreground"
          >
            <span className="size-1 rounded-full bg-faint" aria-hidden />
            {detail}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-2 pt-9 sm:flex-row sm:flex-wrap">
        {children}
      </div>
    </article>
  );
}
