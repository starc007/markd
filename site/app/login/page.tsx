import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto max-w-md rounded-xl border border-border bg-paper p-8">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-faint">
          Markd account
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.018em]">
          Cloud publishing is coming next
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Email sign-in and publishing are not available in the current Markd
          release. They’ll be included in the next app version.
        </p>
        <div className="mt-7 rounded-xl bg-panel p-4 text-sm leading-6 text-muted-foreground">
          Once the update is live, open Markd Settings and choose Markd Cloud to
          sign in with a six-digit email code. Free accounts will include one active
          public note.
        </div>
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
