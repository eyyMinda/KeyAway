import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { cronRunsQuery } from "@/src/lib/sanity/queries";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const LIMIT = 50;

/** GET /api/v1/admin/cron-status - Last cron runs (last 7 days, admin only) */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const since = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
    const runs = await client.fetch<Array<{ _id: string; job: string; source: string; status: string; details?: string; ranAt: string }>>(
      cronRunsQuery,
      { since, limit: LIMIT }
    );

    return NextResponse.json({
      data: { runs: runs ?? [] },
      meta: {}
    });
  } catch (err) {
    console.error("[GET /api/v1/admin/cron-status]", err);
    return Errors.internal();
  }
}
