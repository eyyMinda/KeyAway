import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { listSessionsForRange, type AdminSessionSummary } from "@/src/lib/analytics/sessionAdmin";
import { enrichEventsWithVisitorMeta } from "@/src/lib/analytics/enrichEventsWithVisitorMeta";

/** GET /api/v1/admin/sessions?since=&until=&page=&entry= */
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
    const allRows = await listSessionsForRange(sinceDate.toISOString(), untilDate.toISOString());
    const countsByEntry: Record<string, number> = {};
    for (const row of allRows) {
      const key = row.entry || "direct";
      countsByEntry[key] = (countsByEntry[key] ?? 0) + 1;
    }
    countsByEntry.contributions = allRows.filter(r => (r.contributionCount || r.reportCount) > 0).length;
    countsByEntry.all = allRows.length;

    let rows = allRows;
    if (entry === "contributions") rows = rows.filter(r => (r.contributionCount || r.reportCount) > 0);
    else if (entry !== "all") rows = rows.filter(r => r.entry === entry);

    const total = rows.length;
    const start = (page - 1) * limit;
    const slice = rows.slice(start, start + limit);
    const enriched = (await enrichEventsWithVisitorMeta(
      slice.map(row => ({ ...row, ipHash: row.visitorHash, createdAt: row.startedAt }))
    )) as Array<AdminSessionSummary & { visitTier?: string; visitorIsSpammer?: boolean }>;

    return NextResponse.json({
      data: enriched,
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
