"use client";

import { useCallback } from "react";
import {
  track,
  type AnalyticsEventMap,
  type AnalyticsEventName,
} from "@/lib/analytics";

export function useAnalytics() {
  return useCallback(
    <E extends AnalyticsEventName>(
      event: E,
      properties: AnalyticsEventMap[E],
    ) => track(event, properties),
    [],
  );
}
