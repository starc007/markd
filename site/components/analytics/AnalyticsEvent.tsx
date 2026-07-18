"use client";

import { useEffect, useRef } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { AnalyticsEventMap, AnalyticsEventName } from "@/lib/analytics";

export function AnalyticsEvent<E extends AnalyticsEventName>({
  event,
  properties,
}: {
  event: E;
  properties: AnalyticsEventMap[E];
}) {
  const sent = useRef(false);
  const track = useAnalytics();

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track(event, properties);
  }, [event, properties, track]);

  return null;
}
