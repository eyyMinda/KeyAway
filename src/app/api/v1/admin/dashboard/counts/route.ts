import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { getInboxCounts } from "@/src/lib/admin/inboxCounts.server";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

/** GET /api/v1/admin/dashboard/counts - Unread message, suggestion and giveaway find badges for the admin header */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const data = await getInboxCounts();
    return NextResponse.json({ data, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/dashboard/counts]", err);
    return Errors.internal();
  }
}
