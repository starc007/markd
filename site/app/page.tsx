import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { FeaturesBento } from "@/components/FeaturesBento";
import { AgentTrace } from "@/components/AgentTrace";
import { Footer } from "@/components/Footer";
import { DownloadModal } from "@/components/DownloadModal";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <FeaturesBento />
        <AgentTrace />
      </main>
      <Footer />
      <DownloadModal />
    </>
  );
}
