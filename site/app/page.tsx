import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { ClosingCta } from "@/components/ClosingCta";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <div className="mx-auto max-w-5xl px-6">
          <div className="border-t border-line" />
        </div>
        <Features />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
