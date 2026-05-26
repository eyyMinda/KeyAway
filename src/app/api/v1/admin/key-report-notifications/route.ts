import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { getCachedKeyReportNotifications } from "@/src/lib/admin/keyReportNotifications.server";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

/** GET /api/v1/admin/key-report-notifications - Keys needing attention (negative reports, 60d) */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const items = await getCachedKeyReportNotifications();
    return NextResponse.json({ data: items, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/key-report-notifications]", err);
    return Errors.internal();
  }
}
