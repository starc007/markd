import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { PricingExperience } from "@/components/pricing/PricingExperience";

export const metadata: Metadata = {
  title: "Markd Cloud pricing — connected notes on the web",
  description:
    "Publish linked notes and hosted images with Markd Cloud. Choose yearly or monthly billing.",
};

export default function PricingPage() {
  return (
    <>
      <Nav />
      <PricingExperience />
      <Footer />
    </>
  );
}
