import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { loadDashboardAlerts } from "@/src/lib/admin/dashboardAlerts.server";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

/** GET /api/v1/admin/alerts - Dashboard alerts (jobs, keys, inbox, versions, usage) and count tiles (admin only) */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    return NextResponse.json({ data: await loadDashboardAlerts(), meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/alerts]", err);
    return Errors.internal();
  }
}
