import { flattenSessionEvents, listSessionsWithEvents } from "@/src/lib/analytics/sessionAdmin";
import { AnalyticsEventData } from "@/src/types";

/** Session events in a date range. Open visits and session bundles. */
export async function mergeTrackingEventsForRange(since: string, until: string): Promise<AnalyticsEventData[]> {
  const sessions = await listSessionsWithEvents(since, until);
  return flattenSessionEvents(sessions, since, until).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
