import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { cronStatusQuery } from "@/src/lib/sanity/queries";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { SEVEN_DAYS_MS, isoSince } from "@/src/lib/time";

type CronRunRow = {
  _id: string;
  job: string;
  source: string;
  status: string;
  details?: string;
  ranAt: string;
};

/** GET /api/v1/admin/cron-status - Last cron runs (last 7 days, admin only) */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const since = isoSince(SEVEN_DAYS_MS);
    const payload = await client.fetch<{
      recent?: CronRunRow[] | null;
      latestByJob?: Record<string, CronRunRow | null> | null;
    }>(cronStatusQuery, { since });

    const byId = new Map<string, CronRunRow>();
    for (const run of Object.values(payload?.latestByJob ?? {})) {
      if (run?._id) byId.set(run._id, run);
    }
    for (const run of payload?.recent ?? []) {
      if (run?._id) byId.set(run._id, run);
    }
    const runs = [...byId.values()].sort((a, b) => (a.ranAt < b.ranAt ? 1 : -1));

    return NextResponse.json({
      data: { runs },
      meta: {}
    });
  } catch (err) {
    console.error("[GET /api/v1/admin/cron-status]", err);
    return Errors.internal();
  }
}
