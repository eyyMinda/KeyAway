"use client";

/** @fileoverview Client-only: records `page_viewed` with `notFound` on 404 routes and sets sessionStorage so PageViewTracker does not send a second page view. */
import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/src/lib/analytics/trackEvent";
import { pageViewSkipKey } from "@/src/lib/analytics/pageViewSkip";

const EXCLUDED_HOSTNAMES = new Set(["localhost"]);

export default function NotFoundTracker() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (EXCLUDED_HOSTNAMES.has(window.location.hostname)) return;
    try {
      sessionStorage.setItem(pageViewSkipKey(pathname), "1");
    } catch {
      // sessionStorage unavailable (e.g. private mode)
    }
    void trackEvent("page_viewed", { path: pathname, notFound: true });
  }, [pathname]);

  return null;
}
