import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { getCachedAnalyticsDbUsage } from "@/src/lib/admin/analyticsDbUsage.server";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

/** GET /api/v1/admin/analytics-db - Supabase database size and analytics row counts (cached 10 min, admin only) */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const data = await getCachedAnalyticsDbUsage();
    return NextResponse.json({ data, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/analytics-db]", err);
    return Errors.internal();
  }
}
