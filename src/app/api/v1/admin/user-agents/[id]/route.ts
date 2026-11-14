import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { TAG_USAGE_INSIGHTS, setUserAgentBot } from "@/src/lib/admin/usageInsights.server";
import { forgetFlaggedUserAgents } from "@/src/lib/analytics/flaggedUserAgents";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

/** PATCH /api/v1/admin/user-agents/[id] - `{ isBot }`: flag a user agent so tracking skips it, or clear the flag */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  const id = Number((await params).id);
  const body = (await req.json().catch(() => ({}))) as { isBot?: unknown };
  if (!Number.isInteger(id) || id <= 0) return Errors.validation("Invalid id");
  if (typeof body.isBot !== "boolean") return Errors.validation("isBot must be true or false");

  try {
    if (!(await setUserAgentBot(id, body.isBot))) return Errors.notFound("User agent not found");
    // Other server instances pick the change up within a few minutes.
    forgetFlaggedUserAgents();
    revalidateTag(TAG_USAGE_INSIGHTS, { expire: 0 });
    return NextResponse.json({ data: { id, isBot: body.isBot }, meta: {} });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/user-agents/[id]]", err);
    return Errors.internal();
  }
}
