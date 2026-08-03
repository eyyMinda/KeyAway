"use client";

import { useEffect, useState, type RefObject } from "react";
import {
  FEED_SCROLL_SPY_OFFSET_PX,
  queryFeedMonthMarkers,
  resolveActiveFeedMonth
} from "@/src/lib/site/feedMonthScrollSpy";

export function useFeedMonthScrollSpy(
  enabled: boolean,
  contentRef: RefObject<HTMLElement | null>
): string | null {
  const [visibleMonth, setVisibleMonth] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setVisibleMonth(null);
      return;
    }

    let frame = 0;

    const measure = () => {
      frame = 0;
      const root = contentRef.current ?? document;
      const markers = queryFeedMonthMarkers(root);
      const next = resolveActiveFeedMonth(markers, FEED_SCROLL_SPY_OFFSET_PX);
      setVisibleMonth(prev => (prev === next ? prev : next));
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    const root = contentRef.current;
    const mutationObserver = root ? new MutationObserver(schedule) : null;
    mutationObserver?.observe(root!, { childList: true, subtree: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mutationObserver?.disconnect();
    };
  }, [enabled, contentRef]);

  return enabled ? visibleMonth : null;
}
