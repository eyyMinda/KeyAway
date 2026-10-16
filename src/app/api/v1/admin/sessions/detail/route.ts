import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { readSessionDetail } from "@/src/lib/analytics/sessionAdmin";

/** GET /api/v1/admin/sessions/detail?id= */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();
  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) return Errors.validation("id is required");

  try {
    const detail = await readSessionDetail(id);
    if (!detail) return Errors.notFound("Session not found");
    return NextResponse.json({ data: detail, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/sessions/detail]", err);
    return Errors.internal();
  }
}
