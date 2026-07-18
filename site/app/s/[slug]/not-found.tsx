import { Wordmark } from "@/components/Logo";

export default function PublishedNoteNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md text-center">
        <a
          href="/"
          aria-label="Markd home"
          className="inline-flex rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          <Wordmark size={22} />
        </a>
        <p className="mt-14 font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
          Published note
        </p>
        <h1 className="mt-4 text-[30px] font-[680] leading-tight tracking-[-0.018em]">
          This note is no longer available.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-[14px] leading-6 text-muted-foreground">
          It may have been unpublished, or the link may be incorrect.
        </p>
        <a
          href="/"
          className="mt-9 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-[13px] font-medium text-primary-foreground transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground active:scale-[0.97]"
        >
          Visit Markd
        </a>
      </div>
    </main>
  );
}
