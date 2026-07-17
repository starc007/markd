import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives in a subdir of the app repo; pin tracing to the site root.
  outputFileTracingRoot: import.meta.dirname,
  async redirects() {
    return [
      {
        source: "/downloads",
        destination: "/download",
        permanent: true,
      },
      {
        source: "/downloads/Markd_0.1.4_aarch64.dmg",
        destination:
          "https://github.com/starc007/markd/releases/download/v0.1.4/Markd_0.1.4_aarch64.dmg",
        permanent: true,
      },
      {
        source: "/downloads/Markd_0.1.5_aarch64.dmg",
        destination:
          "https://github.com/starc007/markd/releases/download/v0.1.5/Markd_0.1.5_aarch64.dmg",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Update manifest must never be stale — the app polls it for versions.
        source: "/updates/latest.json",
        headers: [
          { key: "Cache-Control", value: "no-cache, must-revalidate" },
          { key: "Content-Type", value: "application/json" },
        ],
      },
      {
        // Signed bundles / installers are immutable per release.
        source: "/updates/:file*.tar.gz",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/downloads/:file*.dmg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/downloads/:file*.AppImage",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/downloads/:file*.deb",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;

// Enables the Cloudflare bindings + dev platform when running `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
