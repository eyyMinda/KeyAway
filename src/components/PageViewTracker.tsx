"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/src/lib/trackEvent";
import { getUTMParameters } from "@/src/lib/utmUtils";

export default function PageViewTracker() {
  const pathname = usePathname();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (hasTracked.current) return;

    // Skip tracking if running on localhost
    // if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    //   return;
    // }

    const trackPageView = async () => {
      try {
        // Get referrer from document
        const referrer = document.referrer || undefined;

        // Extract program slug from pathname if it's a program page
        const programSlug = pathname.startsWith("/program/")
          ? pathname.split("/program/")[1]?.split("/")[0]
          : undefined;

        // Get UTM parameters from URL
        const utmParams = getUTMParameters();

        // Track the page view
        await trackEvent("page_viewed", {
          path: pathname,
          programSlug,
          referrer: referrer || undefined,
          ...utmParams
        });

        hasTracked.current = true;
      } catch (error) {
        console.error("Error tracking page view:", error);
      }
    };

    // Small delay to ensure page is fully loaded
    const timer = setTimeout(trackPageView, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  // This component doesn't render anything visible
  return null;
}
