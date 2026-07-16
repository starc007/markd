import type { Metadata } from "next";
import { Apple, Terminal } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { DownloadLink } from "@/components/download/DownloadLink";
import { PlatformCard } from "@/components/download/PlatformCard";
import { DMG, LINUX_APPIMAGE, LINUX_DEB, VERSION } from "@/lib/config";

export const metadata: Metadata = {
  title: "Download Markd",
  description:
    "Download Markd for Apple Silicon Macs or x86_64 GNU/Linux systems.",
  alternates: {
    canonical: "/download",
  },
};

export default function DownloadPage() {
  return (
    <>
      <Nav />
      <main className="px-5 pb-20 pt-36 sm:px-8 sm:pt-44">
        <section className="mx-auto w-full max-w-5xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
            Markd {VERSION}
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance font-serif text-[48px] leading-[0.98] tracking-[-0.035em] text-foreground sm:text-[72px]">
            Choose your build.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-[15px] leading-7 text-muted-foreground">
            The same quiet, local-first writing experience. Pick the package
            that fits your system.
          </p>
        </section>

        <section
          aria-label="Available Markd downloads"
          className="mx-auto mt-14 grid w-full max-w-5xl gap-4 md:grid-cols-2 sm:mt-20"
        >
          <PlatformCard
            index="01"
            icon={<Apple className="size-5" strokeWidth={1.7} />}
            platform="macOS"
            architecture="Apple Silicon"
            description="A native disk image for modern Macs. Open it, move Markd to Applications, and start writing."
            details={[
              "macOS 12 or newer",
              "Signed with Developer ID",
              "Notarized by Apple",
            ]}
          >
            <DownloadLink
              href={DMG}
              label="Download .dmg"
              platform="macos"
              format="dmg"
              primary
            />
          </PlatformCard>

          <PlatformCard
            index="02"
            icon={<Terminal className="size-5" strokeWidth={1.7} />}
            platform="GNU/Linux"
            architecture="x86_64"
            description="Use the portable AppImage on most distributions, or install the Debian package on a compatible system."
            details={[
              "Portable AppImage",
              "Debian and Ubuntu package",
              "Signed automatic updates",
            ]}
          >
            <DownloadLink
              href={LINUX_APPIMAGE}
              label="Download AppImage"
              platform="linux"
              format="appimage"
              primary
            />
            <DownloadLink
              href={LINUX_DEB}
              label="Download .deb"
              platform="linux"
              format="deb"
            />
          </PlatformCard>
        </section>

        <p className="mx-auto mt-8 max-w-5xl text-center font-mono text-[10.5px] tracking-[0.08em] text-faint">
          Free and open source · No account · Your notes stay on your disk
        </p>
      </main>
      <Footer />
    </>
  );
}
