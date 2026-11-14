import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { getCachedKeyReview } from "@/src/lib/admin/keyReview.server";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

/** GET /api/v1/admin/key-review - Keys that probably need a status change and doubtful key reports (admin only) */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    return NextResponse.json({ data: await getCachedKeyReview(), meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/key-review]", err);
    return Errors.internal();
  }
}
