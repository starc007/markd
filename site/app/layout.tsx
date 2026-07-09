import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" });

const TITLE = "Markd — the last notes app you'll download";
const DESCRIPTION =
  "Everyone's built a notes app; few are worth keeping. Markd is a fast, local-first markdown editor for macOS — real UI, real speed, and AI that reads your notes. Plain .md files in a folder you own.";

export const metadata: Metadata = {
  metadataBase: new URL("https://usemarkd.app"),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Markd",
  keywords: [
    "markdown notes app",
    "notes app for macOS",
    "local-first notes",
    "markdown editor mac",
    "Obsidian alternative",
    "AI notes app",
    "note taking app",
    "plain text notes",
  ],
  authors: [{ name: "Markd" }],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://usemarkd.app",
    siteName: "Markd",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = { themeColor: "#fcfcfb" };

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Markd",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "macOS 12+",
  description: DESCRIPTION,
  url: "https://usemarkd.app",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${mono.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {children}
      </body>
    </html>
  );
}
