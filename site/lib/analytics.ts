// Thin, provider-agnostic analytics — targets Umami (cookieless, pageviews are
// automatic). No-ops when the script isn't loaded.
declare global {
  interface Window {
    umami?: {
      track: (
        event: string,
        data?: Record<string, string | number | boolean>,
      ) => void;
    };
  }
}

export const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
// Cloud by default; override for a self-hosted instance.
export const UMAMI_SRC =
  process.env.NEXT_PUBLIC_UMAMI_SRC ?? "https://cloud.umami.is/script.js";

/** Fire a custom event (e.g. a download). Safe to call anywhere. */
export function track(
  event: string,
  data?: Record<string, string | number | boolean>,
) {
  if (typeof window === "undefined") return;
  window.umami?.track(event, data);
}
