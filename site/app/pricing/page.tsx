import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { PricingExperience } from "@/components/pricing/PricingExperience";
import { AnalyticsEvent } from "@/components/analytics/AnalyticsEvent";

export const metadata: Metadata = {
  title: "Markd Cloud pricing — connected notes on the web",
  description:
    "Publish linked notes and hosted images with Markd Cloud. Choose yearly or monthly billing.",
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ billing_token?: string }>;
}) {
  const query = await searchParams;
  return (
    <>
      <AnalyticsEvent
        event="pricing_page_viewed"
        properties={{ source: query.billing_token ? "app" : "website" }}
      />
      <Nav />
      <PricingExperience billingToken={query.billing_token} />
      <Footer />
    </>
  );
}
