import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import {
  getCachedAnalyticsSummary,
  setCachedAnalyticsSummary,
  type AnalyticsSummaryCachePayload
} from "@/src/lib/api/adminEventsListCache";
import { enrichEventsWithVisitorMeta } from "@/src/lib/analytics/enrichEventsWithVisitorMeta";
import {
  aggregateEvents,
  transformEventData,
  transformProgramData,
  transformSocialData,
  transformPathActivityTable,
  transformCountryData
} from "@/src/lib/analytics/analyticsUtils";
import { buildSessionSourceTable, flattenSessionEvents, listSessionsWithEvents } from "@/src/lib/analytics/sessionAdmin";
import { AnalyticsEventData } from "@/src/types";

const RECENT_LIMIT = 10;

/** GET /api/v1/admin/analytics/summary?since=&until= — server aggregates + recent activity slice. */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  const sinceRaw = req.nextUrl.searchParams.get("since");
  const untilRaw = req.nextUrl.searchParams.get("until");
  if (!sinceRaw || !untilRaw) return Errors.validation("since and until are required ISO dates");

  const sinceDate = new Date(sinceRaw);
  const untilDate = new Date(untilRaw);
  if (isNaN(sinceDate.getTime()) || isNaN(untilDate.getTime())) {
    return Errors.validation("since and until must be valid ISO dates");
  }

  const since = sinceDate.toISOString();
  const until = untilDate.toISOString();
  const refresh = req.nextUrl.searchParams.get("refresh") === "true";

  try {
    const summaryCached = getCachedAnalyticsSummary(since, until, { bypass: refresh });
    if (summaryCached) {
      return NextResponse.json({
        data: summaryCached.data,
        meta: { cacheHit: true, cachedAt: summaryCached.cachedAt }
      });
    }

    const keyReportOverview = new Set<string>([
      "report_key_working",
      "report_key_expired",
      "report_key_limit_reached"
    ]);
    const sessions = await listSessionsWithEvents(since, until);
    const merged = flattenSessionEvents(sessions, since, until)
      .filter(event => !keyReportOverview.has(event.event))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const { totals, byProgram, bySocial, byPath, byCountry } = aggregateEvents(merged);
    const uniqueVisitors = new Set(merged.map(e => e.ipHash).filter(Boolean)).size;

    const recentSlice = merged.slice(0, RECENT_LIMIT);
    const recentEnriched = (await enrichEventsWithVisitorMeta(
      recentSlice as unknown as Array<Record<string, unknown>>
    )) as unknown as AnalyticsEventData[];

    const data: AnalyticsSummaryCachePayload = {
      totalEvents: merged.length,
      uniqueVisitors,
      uniqueCountries: byCountry.size,
      totals: Object.fromEntries(totals),
      eventChart: transformEventData(totals),
      programTable: transformProgramData(byProgram),
      socialTable: transformSocialData(bySocial),
      pathTable: transformPathActivityTable(merged, byPath),
      countryTable: transformCountryData(byCountry),
      referrerTable: buildSessionSourceTable(sessions.filter(s => s.startedAt >= since && s.startedAt <= until)),
      recentEvents: recentEnriched
    };

    const cachedAt = setCachedAnalyticsSummary(since, until, data);

    return NextResponse.json({
      data,
      meta: { cacheHit: false, cachedAt }
    });
  } catch (err) {
    console.error("[GET /api/v1/admin/analytics/summary]", err);
    return Errors.internal();
  }
}
