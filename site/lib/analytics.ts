import { createTracwell, type TracwellClient } from "tracwell";

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
  }
}

export const TRACWELL_PROJECT_KEY =
  "tw_live_7741af77ba1f485b95d7132245dca203";
export const GOOGLE_ANALYTICS_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

type Provider = "google" | "tracwell";
type QueuedEvent = {
  event: AnalyticsEventName;
  properties: AnalyticsProperties;
};

const MAX_QUEUED_EVENTS = 100;
const readyProviders: Record<Provider, boolean> = {
  google: !GOOGLE_ANALYTICS_ID,
  tracwell: false,
};
const queuedEvents: QueuedEvent[] = [];
let tracwellClient: TracwellClient | undefined;

export function isAnalyticsEnabled(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isAnalyticsExcludedPath(pathname: string): boolean {
  return pathname === "/s" || pathname.startsWith("/s/");
}

/**
 * Creates the one browser-side client used by the site. This must only be
 * called from a client lifecycle after `document` is available.
 */
export function initializeTracwell(): TracwellClient | undefined {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    tracwellClient
  ) {
    return tracwellClient;
  }

  try {
    tracwellClient = createTracwell({
      collectionMode: "product",
      projectKey: TRACWELL_PROJECT_KEY,
      consent: "granted",
      respectDoNotTrack: true,
    });
  } catch {
    // Analytics is best-effort and must never interrupt the site.
  } finally {
    markAnalyticsProviderReady("tracwell");
  }

  return tracwellClient;
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
  return readyProviders.google && readyProviders.tracwell;
}

function sendEvent(
  event: AnalyticsEventName,
  properties: AnalyticsProperties,
): void {
  try {
    tracwellClient?.track(event, properties);
  } catch {
    // One failed provider must not prevent the other provider from receiving it.
  }

  try {
    window.gtag?.("event", event, properties);
  } catch {
    // Analytics is deliberately isolated from the product flow.
  }
}
