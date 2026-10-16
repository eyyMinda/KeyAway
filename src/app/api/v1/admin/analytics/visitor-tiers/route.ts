import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { fetchVisitorTagAggregates } from "@/src/lib/visitors/visitorStore";

/** GET /api/v1/admin/analytics/visitor-tiers?since=&until= — visitors active in range per tier + flagged spammers. */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  const since = new Date(req.nextUrl.searchParams.get("since") ?? "");
  const until = new Date(req.nextUrl.searchParams.get("until") ?? "");
  if (Number.isNaN(since.getTime()) || Number.isNaN(until.getTime())) {
    return Errors.validation("since and until must be valid ISO dates");
  }

  try {
    const rows = await fetchVisitorTagAggregates(since.toISOString(), until.toISOString());
    return NextResponse.json({ data: rows, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/analytics/visitor-tiers]", err);
    return Errors.internal();
  }
}
