import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { siteStatsQuery } from "@/src/lib/sanity/queries";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** GET /api/v1/admin/dashboard/counts - Counts + site stats for admin overview */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const since = new Date(Date.now() - SIXTY_DAYS_MS).toISOString();
    const weekAgo = new Date(Date.now() - WEEK_MS).toISOString();

    const [[newMessages, newSuggestions], siteStats] = await Promise.all([
      Promise.all([
        client.fetch<number>(`count(*[_type == "contactMessage" && status == "new" && createdAt >= $since])`, {
          since
        }),
        client.fetch<number>(`count(*[_type == "keySuggestion" && status == "new" && createdAt >= $since])`, {
          since
        })
      ]),
      client.fetch<{ totalPrograms: number; totalKeys: number; totalReports: number; recentReports: number }>(
        siteStatsQuery,
        { weekAgo }
      )
    ]);

    return NextResponse.json({
      data: {
        newMessages: newMessages ?? 0,
        newSuggestions: newSuggestions ?? 0,
        totalPrograms: siteStats?.totalPrograms ?? 0,
        totalKeys: siteStats?.totalKeys ?? 0,
        totalReports: siteStats?.totalReports ?? 0,
        recentReports: siteStats?.recentReports ?? 0
      },
      meta: {}
    });
  } catch (err) {
    console.error("[GET /api/v1/admin/dashboard/counts]", err);
    return Errors.internal();
  }
}
