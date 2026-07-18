import type { Metadata } from "next";
import { Check, CircleDot, X } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { AnalyticsEvent } from "@/components/analytics/AnalyticsEvent";

export const metadata: Metadata = {
  title: "Welcome to Markd Cloud",
  description: "Your Markd Cloud payment was completed successfully.",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const failed = status === "failed" || status === "cancelled";

  return (
    <>
      <AnalyticsEvent
        event="checkout_result_viewed"
        properties={{ outcome: failed ? "failed" : "success" }}
      />
      <Nav />
      <main className="flex min-h-[calc(100svh-5rem)] items-center px-5 pb-20 pt-28 sm:px-8">
        <section className="mx-auto w-full max-w-lg text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full border border-border-strong bg-card text-foreground">
            {failed ? (
              <X className="size-5" strokeWidth={2} aria-hidden />
            ) : (
              <Check className="size-5" strokeWidth={2} aria-hidden />
            )}
          </div>

          <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
            {failed ? "Payment incomplete" : "Payment complete"}
          </p>
          <h1 className="mt-3 text-balance font-serif text-[44px] leading-[0.98] tracking-[-0.035em] text-foreground sm:text-[54px]">
            {failed ? "Nothing was charged." : "You’re all set."}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-pretty text-[14px] leading-6 text-muted-foreground">
            {failed
              ? "Return to pricing whenever you’re ready to try again."
              : "Your Markd Cloud subscription is being activated. Return to Markd and your account will refresh automatically."}
          </p>

          {failed ? (
            <a
              href="/pricing"
              className="mx-auto mt-7 inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Back to pricing
            </a>
          ) : (
            <div className="mx-auto mt-7 flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-[12px] font-medium text-fg-soft">
              <CircleDot className="size-3.5" strokeWidth={1.8} aria-hidden />
              You can safely close this page
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
