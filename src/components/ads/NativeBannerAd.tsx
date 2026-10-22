"use client";

/**
 * @fileoverview Native banner unit. The script is injected once the slot nears the viewport (with ad consent)
 * and removed on unmount, so it runs again after client-side navigation. It fills the fixed-id container, so
 * render at most one per page. A blocked script or an empty container counts as unfilled and collapses the slot.
 */
import { useEffect, useRef } from "react";
import { useAdConsent } from "@/src/hooks/useAdConsent";
import { useNearViewport } from "@/src/hooks/useNearViewport";
import { NATIVE_BANNER } from "@/src/lib/ads/adConfig";
import { hasRenderedAd, useAdUnit } from "./useAdUnit";

const FILL_POLL_MS = 500;
const FILL_TIMEOUT_MS = 8_000;

export default function NativeBannerAd() {
  const containerRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(containerRef);
  const { status } = useAdConsent();
  const shouldLoad = near && status === "granted";
  const { start, report } = useAdUnit("native", containerRef);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shouldLoad) return;
    start();
    const script = document.createElement("script");
    script.async = true;
    script.src = NATIVE_BANNER.scriptSrc;
    script.setAttribute("data-cfasync", "false");
    script.onerror = () => report("unfilled");
    container.before(script);

    const startedAt = Date.now();
    const poll = setInterval(() => {
      if (hasRenderedAd(container)) {
        clearInterval(poll);
        report("filled");
      } else if (Date.now() - startedAt >= FILL_TIMEOUT_MS) {
        clearInterval(poll);
        report("unfilled");
      }
    }, FILL_POLL_MS);

    return () => {
      clearInterval(poll);
      script.remove();
      container.replaceChildren();
    };
  }, [shouldLoad, start, report]);

  return <div ref={containerRef} id={NATIVE_BANNER.containerId} className="min-h-24 w-full" />;
}
