import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { isResendConfigured } from "@/src/lib/email/resendClient";

/** GET /api/v1/admin/messages/reply/status - Whether outbound email is configured */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  return NextResponse.json({
    data: { configured: isResendConfigured() },
    meta: {}
  });
}
