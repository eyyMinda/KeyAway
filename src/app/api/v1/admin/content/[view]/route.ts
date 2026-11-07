import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { ADMIN_CONTENT_QUERIES, isAdminContentView } from "@/src/lib/admin/adminContent";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { client } from "@/src/sanity/lib/client";

/** GET /api/v1/admin/content/[view] - Named Sanity reads for admin pages (messages, suggestions, …), never cached */
export async function GET(req: NextRequest, { params }: { params: Promise<{ view: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  const { view } = await params;
  if (!isAdminContentView(view)) return Errors.notFound("Unknown view");

  try {
    const data = await client.fetch(ADMIN_CONTENT_QUERIES[view], {}, { cache: "no-store", useCdn: false });
    return NextResponse.json({ data, meta: {} }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error(`[GET /api/v1/admin/content/${view}]`, err);
    return Errors.internal();
  }
}
