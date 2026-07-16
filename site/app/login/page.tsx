import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] px-6 py-16 text-[#171717]">
      <section className="mx-auto max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-black/45">
          Markd account
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
          Sign in to publish
        </h1>
        <p className="mt-3 text-sm leading-6 text-black/60">
          Account sign-in is being connected to the desktop app. Publishing stays
          disabled until a verified Markd session is available.
        </p>
        <div className="mt-7 rounded-xl bg-black/[0.045] p-4 text-sm leading-6 text-black/55">
          Free accounts will include one active public note. Markd Cloud accounts
          will include unlimited publishing and cross-device sync.
        </div>
        <Link
          href="/"
          className="mt-7 inline-flex h-10 items-center rounded-lg bg-black px-4 text-sm font-medium text-white transition-opacity hover:opacity-80"
        >
          Back to Markd
        </Link>
      </section>
    </main>
  );
}
