import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { SIXTY_DAYS_MS, isoSince } from "@/src/lib/time";

const inboxBadgeQuery = `{
  "newMessages": count(*[_type == "contactMessage" && status == "new" && createdAt >= $since]),
  "newSuggestions": count(*[_type == "keySuggestion" && status == "new" && createdAt >= $since])
}`;

const getInboxBadges = unstable_cache(
  async () => {
    const since = isoSince(SIXTY_DAYS_MS);
    const row = await client.fetch<{ newMessages?: number; newSuggestions?: number }>(inboxBadgeQuery, { since });
    return { newMessages: row?.newMessages ?? 0, newSuggestions: row?.newSuggestions ?? 0 };
  },
  ["admin-inbox-badges"],
  { revalidate: 60 }
);

/** GET /api/v1/admin/dashboard/counts - Unread message and suggestion badges for the admin header */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const data = await getInboxBadges();
    return NextResponse.json({ data, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/dashboard/counts]", err);
    return Errors.internal();
  }
}
