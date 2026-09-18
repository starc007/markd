import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { markAnalyticsProviderReady, track } from "../lib/analytics";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const mutableEnv = process.env as unknown as Record<string, string | undefined>;
const originalNodeEnv = process.env.NODE_ENV;

function installWindow(pathname: string, providers: Partial<Window>): void {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {
      location: { pathname },
      ...providers,
    },
  });
}

afterEach(() => {
  if (originalNodeEnv === undefined) {
    delete mutableEnv.NODE_ENV;
  } else {
    mutableEnv.NODE_ENV = originalNodeEnv;
  }
  if (originalWindow) {
    Object.defineProperty(globalThis, "window", originalWindow);
  } else {
    delete (globalThis as unknown as Record<string, unknown>).window;
  }
});

describe("analytics safety", () => {
  test("an unavailable Tracwell client cannot block Google or the caller", () => {
    mutableEnv.NODE_ENV = "production";
    let googleEvents = 0;
    installWindow("/pricing", {
      gtag: () => { googleEvents += 1; },
    });
    markAnalyticsProviderReady("google");
    markAnalyticsProviderReady("tracwell");

    assert.doesNotThrow(() =>
      track("pricing_checkout_opened", { interval: "yearly" }),
    );
    assert.equal(googleEvents, 1);
  });

  test("published pages never dispatch events", () => {
    mutableEnv.NODE_ENV = "production";
    let events = 0;
    installWindow("/s/public-note", {
      gtag: () => { events += 1; },
    });

    track("landing_page_viewed", {});
    assert.equal(events, 0);
  });

  test("local development never dispatches events", () => {
    mutableEnv.NODE_ENV = "development";
    let events = 0;
    installWindow("/pricing", {
      gtag: () => { events += 1; },
    });
    markAnalyticsProviderReady("google");
    markAnalyticsProviderReady("tracwell");

    track("pricing_page_viewed", { source: "website" });
    assert.equal(events, 0);
  });
});
