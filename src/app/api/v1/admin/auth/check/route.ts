import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

/** GET /api/v1/admin/auth/check - Check if current context has admin access */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  try {
    const admin = await requireAdminSession();
    if (admin instanceof Response) return admin;
    return NextResponse.json({ data: { isAdmin: true }, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/auth/check]", err);
    return Errors.internal();
  }
}
