import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const instrument = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://usemarkd.app"),
  title: "Markd — local-first markdown notes for macOS",
  description:
    "A fast, local-first markdown notes app for macOS. Plain files in a folder you own. No cloud, no lock-in.",
  openGraph: {
    title: "Markd — local-first markdown notes for macOS",
    description:
      "Plain files in a folder you own. Local-first, offline, yours.",
    url: "https://usemarkd.app",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfa" },
    { media: "(prefers-color-scheme: dark)", color: "#121211" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${instrument.variable} ${jetbrains.variable}`}
    >
      <body className="grain">{children}</body>
    </html>
  );
}
