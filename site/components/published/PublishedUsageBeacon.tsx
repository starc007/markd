"use client";

import { useEffect, useRef } from "react";

export function PublishedUsageBeacon({
  endpoint,
  slug,
  path,
}: {
  endpoint: string;
  slug: string;
  path: string;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const body = JSON.stringify({ slug, path });
    const payload = new Blob([body], { type: "text/plain;charset=UTF-8" });
    if (navigator.sendBeacon?.(endpoint, payload)) return;
    void fetch(endpoint, {
      method: "POST",
      body,
      headers: { "content-type": "text/plain;charset=UTF-8" },
      mode: "no-cors",
      keepalive: true,
    }).catch(() => undefined);
  }, [endpoint, path, slug]);

  return null;
}
