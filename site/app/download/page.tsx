import type { Metadata } from "next";
import { Apple } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { DownloadLink } from "@/components/download/DownloadLink";
import { PlatformCard } from "@/components/download/PlatformCard";
import { LinuxIcon } from "@/components/download/PlatformIcons";
import { AnalyticsEvent } from "@/components/analytics/AnalyticsEvent";
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
      <AnalyticsEvent event="download_page_viewed" properties={{}} />
      <Nav />
      <main className="px-5 pb-14 pt-24 sm:px-8 sm:pt-28">
        <section className="mx-auto w-full max-w-5xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
            Markd {VERSION}
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-balance font-serif text-[44px] leading-[0.98] tracking-[-0.035em] text-foreground sm:text-[56px]">
            Choose your build.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[14px] leading-6 text-muted-foreground">
            The same quiet, local-first writing experience. Pick the package
            that fits your system.
          </p>
        </section>

        <section
          aria-label="Available Markd downloads"
          className="mx-auto mt-8 grid w-full max-w-5xl gap-4 md:grid-cols-2 sm:mt-10"
        >
          <PlatformCard
            index="01"
            icon={<Apple className="size-[18px]" strokeWidth={1.7} />}
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
            icon={<LinuxIcon className="size-[18px]" />}
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

        <p className="mx-auto mt-4 max-w-5xl text-center font-mono text-[10.5px] tracking-[0.08em] text-faint">
          Free and open source · No account · Your notes stay on your disk
        </p>
      </main>
      <Footer />
    </>
  );
}
