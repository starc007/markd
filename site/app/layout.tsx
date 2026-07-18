import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import {
  GOOGLE_ANALYTICS_ID,
  UMAMI_SRC,
  UMAMI_WEBSITE_ID,
} from "@/lib/analytics";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" });

const TITLE = "Markd — the last notes app you'll download";
const DESCRIPTION =
  "Everyone's built a notes app; few are worth keeping. Markd is a fast, local-first markdown editor for macOS and Linux, with real UI, real speed, and AI that reads your notes. Plain .md files in a folder you own.";

export const metadata: Metadata = {
  metadataBase: new URL("https://usemarkd.app"),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Markd",
  keywords: [
    "markdown notes app",
    "notes app for macOS",
    "notes app for Linux",
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

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#fbfbfa",
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Markd",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "macOS 12+, Linux x86_64",
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
        {GOOGLE_ANALYTICS_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GOOGLE_ANALYTICS_ID}');
              `}
            </Script>
          </>
        ) : null}
        {UMAMI_WEBSITE_ID ? (
          <Script
            defer
            src={UMAMI_SRC}
            data-website-id={UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        ) : null}
        {children}
      </body>
    </html>
  );
}
