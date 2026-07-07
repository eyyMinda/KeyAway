"use client";

/** @fileoverview Sends `page_viewed` after human engagement/dwell; skips bots, admin/studio, localhost. */
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/src/lib/analytics/trackEvent";
import { getUTMParameters } from "@/src/lib/analytics/utmUtils";
import { pageViewSkipKey } from "@/src/lib/analytics/pageViewSkip";
import { primaryReferrerForPageView } from "@/src/lib/analytics/referrerResolve";
import { isAdminSession } from "@/src/lib/admin/isAdminSession";
import { shouldSkipClientPageView, waitForPageViewEngagement } from "@/src/lib/analytics/shouldSendPageView";

const log = (...args: unknown[]) => {
  console.info("PageViewTracker:", ...args);
};

const EXCLUDED_HOSTNAMES = new Set(["localhost"]);
const EXCLUDED_PATH_PREFIXES = ["/admin", "/studio"] as const;

function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const prevFullUrlRef = useRef<string | undefined>(undefined);
  const lastSentKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && EXCLUDED_HOSTNAMES.has(window.location.hostname)) {
      return log("skipped on hostname", window.location.hostname, "path:", pathname);
    }
    if (isExcludedPath(pathname)) return log("skipped excluded path", pathname);
    if (shouldSkipClientPageView()) return log("skipped automated client", pathname);

    const search = typeof window !== "undefined" ? window.location.search : "";
    const dedupeKey = `${pathname}${search}`;
    if (lastSentKeyRef.current === dedupeKey) return;

    const controller = new AbortController();

    const trackPageView = async () => {
      try {
        if (await isAdminSession()) return log("skipped admin session", pathname);

        try {
          await waitForPageViewEngagement(controller.signal);
        } catch {
          return log("skipped page view (bot or aborted)", pathname);
        }

        try {
          const sk = pageViewSkipKey(pathname);
          if (sessionStorage.getItem(sk)) {
            sessionStorage.removeItem(sk);
            lastSentKeyRef.current = dedupeKey;
            prevFullUrlRef.current = typeof window !== "undefined" ? window.location.href : undefined;
            return;
          }
        } catch {
          // sessionStorage unavailable
        }

        const href = typeof window !== "undefined" ? window.location.href : "";
        const referrer = primaryReferrerForPageView({
          currentHref: href,
          documentReferrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
          previousFullUrl: prevFullUrlRef.current
        });

        const programSlug = pathname.startsWith("/program/")
          ? pathname.split("/program/")[1]?.split("/")[0]
          : undefined;

        const utmParams = getUTMParameters();

        const payload = {
          path: pathname,
          programSlug,
          referrer,
          ...utmParams
        } as const;

        await trackEvent("page_viewed", payload);
        lastSentKeyRef.current = dedupeKey;
        prevFullUrlRef.current = typeof window !== "undefined" ? window.location.href : undefined;
      } catch (error) {
        console.error("Error tracking page view:", error);
      }
    };

    void trackPageView();

    return () => controller.abort();
  }, [pathname]);

  return null;
}
