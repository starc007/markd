"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import {
  GOOGLE_ANALYTICS_ID,
  isAnalyticsExcludedPath,
  markAnalyticsProviderReady,
  UMAMI_SRC,
  UMAMI_WEBSITE_ID,
} from "@/lib/analytics";

export function AnalyticsProvider() {
  const pathname = usePathname();
  const excluded = isAnalyticsExcludedPath(pathname);
  const [googleReady, setGoogleReady] = useState(false);
  const [umamiReady, setUmamiReady] = useState(false);
  const lastGooglePath = useRef<string | null>(null);
  const lastUmamiPath = useRef<string | null>(null);

  useEffect(() => {
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

    if (umamiReady && lastUmamiPath.current !== pathname && UMAMI_WEBSITE_ID) {
      window.umami?.track({
        website: UMAMI_WEBSITE_ID,
        url: pathname,
        title: document.title,
      });
      lastUmamiPath.current = pathname;
    }
  }, [excluded, googleReady, pathname, umamiReady]);

  if (excluded) return null;

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
      {UMAMI_WEBSITE_ID ? (
        <Script
          defer
          src={UMAMI_SRC}
          data-website-id={UMAMI_WEBSITE_ID}
          data-auto-track="false"
          data-exclude-search="true"
          strategy="afterInteractive"
          onReady={() => {
            markAnalyticsProviderReady("umami");
            setUmamiReady(true);
          }}
        />
      ) : null}
    </>
  );
}
