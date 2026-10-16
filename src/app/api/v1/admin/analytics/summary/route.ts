import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { getCachedAnalyticsSummary, setCachedAnalyticsSummary } from "@/src/lib/api/adminEventsListCache";
import { buildAnalyticsSummary } from "@/src/lib/analytics/sessionAdmin";

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

    const data = await buildAnalyticsSummary(since, until);
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
