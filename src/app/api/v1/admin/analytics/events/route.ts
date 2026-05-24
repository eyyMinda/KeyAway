import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { mergeTrackingEventsForRange } from "@/src/lib/analytics/mergeTrackingEventsForRange";
import { enrichEventsWithVisitorMeta } from "@/src/lib/analytics/enrichEventsWithVisitorMeta";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

/** GET /api/v1/admin/analytics/events?since=&until= — server-side range fetch (no browser Sanity client). */
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

  try {
    const merged = await mergeTrackingEventsForRange(sinceDate.toISOString(), untilDate.toISOString());
    const rows = await enrichEventsWithVisitorMeta(merged as unknown as Array<Record<string, unknown>>);
    return NextResponse.json({ data: rows, meta: { count: rows.length } });
  } catch (err) {
    console.error("[GET /api/v1/admin/analytics/events]", err);
    return Errors.internal();
  }
}
