import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { getCachedUsageInsights } from "@/src/lib/admin/usageInsights.server";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

/** GET /api/v1/admin/usage-insights - Database traffic, rollup status and user agent traffic (cached 10 min, admin only) */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    return NextResponse.json({ data: await getCachedUsageInsights(), meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/usage-insights]", err);
    return Errors.internal();
  }
}
