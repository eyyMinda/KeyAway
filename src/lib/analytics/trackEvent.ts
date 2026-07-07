import { AnalyticsEvent, KeyReportEvent, TrackEventMeta } from "@/src/types";
import { isAdminSession } from "@/src/lib/admin/isAdminSession";

export async function trackEvent(event: AnalyticsEvent | KeyReportEvent, meta?: TrackEventMeta) {
  try {
    if (await isAdminSession()) return;

    await fetch("/api/v1/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, meta }),
      keepalive: true // better delivery when user navigates away
    });
  } catch (e) {
    void e;
    // keep silent; analytics should never break UX
  }
}
