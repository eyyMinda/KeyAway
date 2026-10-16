import { NextRequest, NextResponse } from "next/server";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { isLikelyBotUserAgent } from "@/src/lib/api/botUserAgent";
import { getClientIp, hashIp } from "@/src/lib/api/requestGeo";
import { isDevelopmentEnv } from "@/src/lib/env/isDevelopment";
import { getProgramCommentViewerState } from "@/src/lib/program/programCommentViewer";

/** GET /api/v1/program-comments/viewer?programSlug= — reaction summaries with this visitor's flags + their own comment/reply keys */
export async function GET(req: NextRequest) {
  const isDev = isDevelopmentEnv();
  if (!isDev && isLikelyBotUserAgent(req.headers.get("user-agent"))) {
    return Errors.badRequest("Automated requests are not allowed");
  }

  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const programSlug = req.nextUrl.searchParams.get("programSlug")?.trim() ?? "";
  if (!programSlug) {
    return Errors.validation("programSlug is required", [{ field: "programSlug", message: "Required" }]);
  }

  const ipHash = hashIp(getClientIp(req)) ?? (isDev ? "dev-local" : undefined);
  if (!ipHash) return Errors.badRequest("Unable to process request");

  try {
    const data = await getProgramCommentViewerState(programSlug, ipHash);
    if (!data) return Errors.notFound("Program not found");
    // Per-visitor payload: never cache in shared caches.
    return NextResponse.json({ data, meta: {} }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("[GET /api/v1/program-comments/viewer]", err);
    return Errors.internal();
  }
}
