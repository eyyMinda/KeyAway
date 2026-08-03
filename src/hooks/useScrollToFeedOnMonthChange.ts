"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { scrollToFeedSection } from "@/src/lib/site/feedHrefUtils";

/** Scroll to the feed grid when the month filter changes — not on limit-only pagination. */
export function useScrollToFeedOnMonthChange() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month");
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (month) scrollToFeedSection();
      return;
    }

    scrollToFeedSection();
  }, [month]);
}
