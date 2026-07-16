import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { FeaturesBento } from "@/components/FeaturesBento";
import { AgentTrace } from "@/components/AgentTrace";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
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
