import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { loadAdminAttention } from "@/src/lib/admin/attention.server";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

/** GET /api/v1/admin/attention - Failed or overdue cron jobs and program version updates (admin only) */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    return NextResponse.json({ data: await loadAdminAttention(), meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/attention]", err);
    return Errors.internal();
  }
}
