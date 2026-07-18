import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto max-w-2xl rounded-xl border border-border bg-paper p-8">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-faint">
          Markd Cloud
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.018em]">
          Publish connected notes on the web
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          One subscription includes linked pages, hosted images, and future
          cross-device sync. Choose your billing interval during checkout.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border-strong bg-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Yearly</p>
              <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-primary-foreground">
                Save 25%
              </span>
            </div>
            <p className="mt-5 text-2xl font-semibold tracking-[-0.018em]">$72/year</p>
            <p className="mt-1 text-xs text-muted-foreground">$6 per month, billed yearly</p>
          </div>
          <div className="rounded-xl border border-border bg-panel p-5">
            <p className="text-sm font-semibold">Monthly</p>
            <p className="mt-5 text-2xl font-semibold tracking-[-0.018em]">$8/month</p>
            <p className="mt-1 text-xs text-muted-foreground">Flexible monthly billing</p>
          </div>
        </div>
        <p className="mt-5 rounded-xl bg-panel p-4 text-sm leading-6 text-muted-foreground">
          Checkout is not open yet. Until billing launches, Cloud access is managed manually.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          Back to Markd
        </Link>
      </section>
    </main>
  );
}
