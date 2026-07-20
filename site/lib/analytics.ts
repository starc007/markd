export type AnalyticsProperties = Record<string, string | number | boolean>;

export type AnalyticsEventMap = {
  landing_page_viewed: AnalyticsProperties;
  landing_download_clicked: { placement: "nav" | "hero" | "footer" };
  download_page_viewed: AnalyticsProperties;
  download_started: {
    version: string;
    platform: "macos" | "linux";
    format: "dmg" | "appimage" | "deb";
  };
  pricing_page_viewed: { source: "app" | "website" };
  pricing_interval_changed: { interval: "monthly" | "yearly" };
  pricing_checkout_started: {
    interval: "monthly" | "yearly";
    source: "app" | "website";
  };
  pricing_checkout_opened: { interval: "monthly" | "yearly" };
  pricing_checkout_failed: { interval: "monthly" | "yearly" };
  checkout_result_viewed: { outcome: "success" | "failed" };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    umami?: {
      track: {
        (): void;
        (event: string, data?: AnalyticsProperties): void;
        (payload: AnalyticsProperties): void;
      };
    };
  }
}

export const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
export const UMAMI_SRC =
  process.env.NEXT_PUBLIC_UMAMI_SRC ?? "https://cloud.umami.is/script.js";
export const GOOGLE_ANALYTICS_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

type Provider = "google" | "umami";
type QueuedEvent = {
  event: AnalyticsEventName;
  properties: AnalyticsProperties;
};

const MAX_QUEUED_EVENTS = 100;
const readyProviders: Record<Provider, boolean> = {
  google: !GOOGLE_ANALYTICS_ID,
  umami: !UMAMI_WEBSITE_ID,
};
const queuedEvents: QueuedEvent[] = [];

export function isAnalyticsEnabled(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isAnalyticsExcludedPath(pathname: string): boolean {
  return pathname === "/s" || pathname.startsWith("/s/");
}

export function track<E extends AnalyticsEventName>(
  event: E,
  properties: AnalyticsEventMap[E],
): void {
  try {
    if (
      !isAnalyticsEnabled() ||
      typeof window === "undefined" ||
      isAnalyticsExcludedPath(window.location.pathname)
    ) {
      return;
    }

    if (!allProvidersReady()) {
      if (queuedEvents.length >= MAX_QUEUED_EVENTS) queuedEvents.shift();
      queuedEvents.push({ event, properties });
      return;
    }

    sendEvent(event, properties);
  } catch {
    // Analytics is best-effort and must never interrupt a product action.
  }
}

export function markAnalyticsProviderReady(provider: Provider): void {
  try {
    readyProviders[provider] = true;
    if (!allProvidersReady()) return;

    for (const queued of queuedEvents.splice(0)) {
      if (!isAnalyticsExcludedPath(window.location.pathname)) {
        sendEvent(queued.event, queued.properties);
      }
    }
  } catch {
    queuedEvents.length = 0;
  }
}

function allProvidersReady(): boolean {
  return readyProviders.google && readyProviders.umami;
}

function sendEvent(event: AnalyticsEventName, properties: AnalyticsProperties): void {
  try {
    window.umami?.track(event, properties);
  } catch {
    // One failed provider must not prevent other providers from receiving it.
  }

  try {
    window.gtag?.("event", event, properties);
  } catch {
    // Analytics is deliberately isolated from the product flow.
  }
}
