import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

/** GET /api/v1/admin/dashboard/counts - New messages and suggestions counts (last 60 days) */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const { isAdmin } = await checkAdminAccess();
  if (!isAdmin) return Errors.unauthorized();

  try {
    const since = new Date(Date.now() - SIXTY_DAYS_MS).toISOString();

    const [newMessages, newSuggestions] = await Promise.all([
      client.fetch<number>(`count(*[_type == "contactMessage" && status == "new" && createdAt >= $since])`, {
        since
      }),
      client.fetch<number>(`count(*[_type == "keySuggestion" && status == "new" && createdAt >= $since])`, {
        since
      })
    ]);

    return NextResponse.json({
      data: { newMessages: newMessages ?? 0, newSuggestions: newSuggestions ?? 0 },
      meta: {}
    });
  } catch (err) {
    console.error("[GET /api/v1/admin/dashboard/counts]", err);
    return Errors.internal();
  }
}
