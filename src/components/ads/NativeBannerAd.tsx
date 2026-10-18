"use client";

/**
 * @fileoverview Native banner unit. The script is injected once the slot nears the viewport (with ad consent)
 * and removed on unmount, so it runs again after client-side navigation. It fills the fixed-id container, so
 * render at most one per page.
 */
import { useEffect, useRef } from "react";
import { useAdConsent } from "@/src/hooks/useAdConsent";
import { useNearViewport } from "@/src/hooks/useNearViewport";
import { NATIVE_BANNER } from "@/src/lib/ads/adConfig";

export default function NativeBannerAd() {
  const containerRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(containerRef);
  const { status } = useAdConsent();
  const shouldLoad = near && status === "granted";

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shouldLoad) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = NATIVE_BANNER.scriptSrc;
    script.setAttribute("data-cfasync", "false");
    container.before(script);
    return () => {
      script.remove();
      container.replaceChildren();
    };
  }, [shouldLoad]);

  return <div ref={containerRef} id={NATIVE_BANNER.containerId} className="min-h-24 w-full" />;
}
