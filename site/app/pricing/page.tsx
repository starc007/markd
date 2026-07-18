import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { PricingExperience } from "@/components/pricing/PricingExperience";
import { AnalyticsEvent } from "@/components/analytics/AnalyticsEvent";

export const metadata: Metadata = {
  title: "Cloud pricing",
  description:
    "Publish linked notes and hosted images with Markd Cloud. Choose yearly or monthly billing.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Markd Cloud pricing",
    description:
      "Publish connected Markdown notes and hosted images for $6 per month billed yearly or $8 billed monthly.",
    url: "/pricing",
  },
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
