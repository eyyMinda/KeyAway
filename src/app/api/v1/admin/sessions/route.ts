import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { listSessionsPage } from "@/src/lib/analytics/sessionAdmin";

/** GET /api/v1/admin/sessions?since=&until=&page=&entry=&q= */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();
  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  const sinceRaw = req.nextUrl.searchParams.get("since");
  const untilRaw = req.nextUrl.searchParams.get("until");
  if (!sinceRaw || !untilRaw) return Errors.validation("since and until are required ISO dates");
  const sinceDate = new Date(sinceRaw);
  const untilDate = new Date(untilRaw);
  if (Number.isNaN(sinceDate.getTime()) || Number.isNaN(untilDate.getTime())) {
    return Errors.validation("since and until must be valid ISO dates");
  }

  const page = Math.max(1, Number.parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "25", 10) || 25));
  const entry = req.nextUrl.searchParams.get("entry") ?? "all";

  try {
    const { rows, total, countsByEntry } = await listSessionsPage({
      since: sinceDate.toISOString(),
      until: untilDate.toISOString(),
      entry,
      q: req.nextUrl.searchParams.get("q") ?? undefined,
      page,
      limit
    });

    return NextResponse.json({
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        countsByEntry
      }
    });
  } catch (err) {
    console.error("[GET /api/v1/admin/sessions]", err);
    return Errors.internal();
  }
}
