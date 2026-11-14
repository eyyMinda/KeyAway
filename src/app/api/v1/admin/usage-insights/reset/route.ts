import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { TAG_USAGE_INSIGHTS, resetQueryStats } from "@/src/lib/admin/usageInsights.server";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

/** POST /api/v1/admin/usage-insights/reset - Reset the query statistics behind the database traffic card (admin only) */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    await resetQueryStats();
    revalidateTag(TAG_USAGE_INSIGHTS, { expire: 0 });
    return NextResponse.json({ data: { ok: true }, meta: {} });
  } catch (err) {
    console.error("[POST /api/v1/admin/usage-insights/reset]", err);
    return Errors.internal();
  }
}
