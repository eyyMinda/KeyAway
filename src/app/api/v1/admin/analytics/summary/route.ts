import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import {
  getMergedEventsForAdmin,
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
  transformCountryData,
  transformReferrerDataWithParams
} from "@/src/lib/analytics/analyticsUtils";
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

    const { events: merged, cacheHit: mergeCacheHit, cachedAt: mergeCachedAt } =
      await getMergedEventsForAdmin(since, until, { bypass: refresh });

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
      referrerTable: transformReferrerDataWithParams(merged),
      recentEvents: recentEnriched
    };

    const cachedAt = setCachedAnalyticsSummary(since, until, data);

    return NextResponse.json({
      data,
      meta: { cacheHit: mergeCacheHit, cachedAt: refresh ? mergeCachedAt : cachedAt }
    });
  } catch (err) {
    console.error("[GET /api/v1/admin/analytics/summary]", err);
    return Errors.internal();
  }
}
