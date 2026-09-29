import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { getCachedDatasetDocCounts } from "@/src/lib/admin/datasetDocCounts.server";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

/** GET /api/v1/admin/dataset-counts - Document counts by type (cached 10 min, admin only) */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const data = await getCachedDatasetDocCounts();
    return NextResponse.json({ data, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/dataset-counts]", err);
    return Errors.internal();
  }
}
