"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/src/lib/trackEvent";
import { getUTMParameters } from "@/src/lib/utmUtils";

// Debug logger
const log = (...args: unknown[]) => {
  console.info("PageViewTracker:", ...args);
};

// Exclusion rules
const EXCLUDED_HOSTNAMES = new Set(["localhost"]);
const EXCLUDED_PATH_PREFIXES = ["/admin", "/studio"] as const;

function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip tracking if running on excluded hostnames
    if (typeof window !== "undefined" && EXCLUDED_HOSTNAMES.has(window.location.hostname)) {
      return log("skipped on hostname", window.location.hostname, "path:", pathname);
    }
    // Skip tracking for excluded path prefixes
    if (isExcludedPath(pathname)) return log("skipped excluded path", pathname);
    // Avoid duplicate sends for the exact same path
    if (prevPathRef.current === pathname) return; // log("skipped duplicate path", pathname);

    const trackPageView = async () => {
      try {
        // Prefer internal referrer (previous path) for SPA nav; fallback to document.referrer
        const externalReferrer = document.referrer || undefined;
        const internalReferrer =
          prevPathRef.current && prevPathRef.current !== pathname
            ? `https://www.keyaway.app${prevPathRef.current}`
            : undefined;

        // Extract program slug from pathname if it's a program page
        const programSlug = pathname.startsWith("/program/")
          ? pathname.split("/program/")[1]?.split("/")[0]
          : undefined;

        // Get UTM parameters from URL
        const utmParams = getUTMParameters();

        // Track the page view
        const payload = {
          path: pathname,
          programSlug,
          referrer: internalReferrer || externalReferrer,
          ...utmParams
        } as const;

        // log("sending page_viewed", payload);

        await trackEvent("page_viewed", payload);
        prevPathRef.current = pathname;
      } catch (error) {
        console.error("Error tracking page view:", error);
      }
    };

    // Small delay to ensure page is fully loaded
    const timer = setTimeout(trackPageView, 200);

    return () => clearTimeout(timer);
  }, [pathname]);

  // This component doesn't render anything visible
  return null;
}
