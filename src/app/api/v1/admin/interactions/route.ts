import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { InteractionEventBucketData } from "@/src/types";

function aggregate(rows: InteractionEventBucketData[], key: keyof InteractionEventBucketData): Array<{ key: string; value: number }> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const k = row[key];
    if (!k || typeof k !== "string") continue;
    map.set(k, (map.get(k) || 0) + row.count);
  }
  return Array.from(map.entries())
    .map(([k, v]) => ({ key: k, value: v }))
    .sort((a, b) => b.value - a.value);
}

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
  if (isNaN(sinceDate.getTime()) || isNaN(untilDate.getTime())) {
    return Errors.validation("since and until must be valid ISO dates");
  }
  const since = sinceDate.toISOString();
  const until = untilDate.toISOString();

  try {
    const rows = await client.fetch<InteractionEventBucketData[]>(
      `*[_type=="interactionEventBucket" && lastSeenAt >= $since && lastSeenAt <= $until]{
        _id, bucketKey, bucketDateHour, pagePath, sectionId, interactionId, programSlug, count, lastSeenAt, createdAt
      } | order(lastSeenAt desc)`,
      { since, until }
    );

    const totalCount = rows.reduce((sum, r) => sum + (r.count || 0), 0);
    const byInteraction = aggregate(rows, "interactionId");
    const bySection = aggregate(rows, "sectionId");
    const byPath = aggregate(rows, "pagePath");
    const byProgram = aggregate(rows, "programSlug");

    return NextResponse.json({
      data: {
        rows,
        totals: {
          totalCount,
          buckets: rows.length,
          uniqueInteractionIds: byInteraction.length,
          uniqueSections: bySection.length
        },
        byInteraction,
        bySection,
        byPath,
        byProgram
      },
      meta: { since, until }
    });
  } catch (err) {
    console.error("[GET /api/v1/admin/interactions]", err);
    return Errors.internal();
  }
}
