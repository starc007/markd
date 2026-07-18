import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { FeaturesBento } from "@/components/FeaturesBento";
import { AgentTrace } from "@/components/AgentTrace";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { AnalyticsEvent } from "@/components/analytics/AnalyticsEvent";

export default function Home() {
  return (
    <>
      <AnalyticsEvent event="landing_page_viewed" properties={{}} />
      <Nav />
      <main>
        <Hero />
        <FeaturesBento />
        <AgentTrace />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
