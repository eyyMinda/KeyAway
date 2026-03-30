/** @fileoverview Predicate for admin/analytics rows: `page_viewed` with `notFound` (404 or invalid program slug). */
import type { AnalyticsEventData } from "@/src/types";

export function isPageViewNotFoundRow(e: Pick<AnalyticsEventData, "event" | "notFound">): boolean {
  return e.event === "page_viewed" && e.notFound === true;
}
