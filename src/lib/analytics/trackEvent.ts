import { AnalyticsEvent, KeyReportEvent, TrackEventMeta } from "@/src/types";
import { enqueueAnalyticsEvent } from "@/src/lib/analytics/sessionClient";

/** Queue a visit event. Flushed in a batch onto the current tracking session. */
export async function trackEvent(event: AnalyticsEvent | KeyReportEvent, meta?: TrackEventMeta) {
  try {
    enqueueAnalyticsEvent(event, meta);
  } catch (e) {
    void e;
  }
}
