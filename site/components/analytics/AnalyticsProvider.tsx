"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import {
  GOOGLE_ANALYTICS_ID,
  initializeTracwell,
  isAnalyticsEnabled,
  isAnalyticsExcludedPath,
  markAnalyticsProviderReady,
} from "@/lib/analytics";

export function AnalyticsProvider() {
  const pathname = usePathname();
  const enabled = isAnalyticsEnabled();
  const excluded = isAnalyticsExcludedPath(pathname);
  const [googleReady, setGoogleReady] = useState(false);
  const lastGooglePath = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || excluded) return;
    initializeTracwell();
  }, [enabled, excluded]);

  useEffect(() => {
    if (!enabled) return;
    if (GOOGLE_ANALYTICS_ID) {
      Object.assign(window, { [`ga-disable-${GOOGLE_ANALYTICS_ID}`]: excluded });
    }
    if (excluded) return;

    if (googleReady && lastGooglePath.current !== pathname) {
      window.gtag?.("event", "page_view", {
        page_location: `${window.location.origin}${pathname}`,
        page_path: pathname,
        page_title: document.title,
      });
      lastGooglePath.current = pathname;
    }
  }, [enabled, excluded, googleReady, pathname]);

  if (!enabled || excluded) return null;

  return (
    <>
      {GOOGLE_ANALYTICS_ID ? (
        <>
          <Script id="google-analytics-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GOOGLE_ANALYTICS_ID}', { send_page_view: false });
            `}
          </Script>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
            strategy="afterInteractive"
            onReady={() => {
              markAnalyticsProviderReady("google");
              setGoogleReady(true);
            }}
          />
        </>
      ) : null}
    </>
  );
}
