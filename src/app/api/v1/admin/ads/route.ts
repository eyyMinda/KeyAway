import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { getAdStats } from "@/src/lib/analytics/adStatsStore";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** GET /api/v1/admin/ads?since=YYYY-MM-DD&until=YYYY-MM-DD — daily ad counters in range + all-time path totals. */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();
  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  const since = req.nextUrl.searchParams.get("since") ?? "";
  const until = req.nextUrl.searchParams.get("until") ?? "";
  if (!DATE.test(since) || !DATE.test(until)) return Errors.validation("since and until must be YYYY-MM-DD dates");

  try {
    const data = await getAdStats(since, until);
    return NextResponse.json({ data, meta: { since, until } });
  } catch (err) {
    console.error("[GET /api/v1/admin/ads]", err);
    return Errors.internal();
  }
}
