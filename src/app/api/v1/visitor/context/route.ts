/** @fileoverview GET visitor tier / spammer flag for public pages (client fetch; keeps program RSC static). */
import { NextRequest, NextResponse } from "next/server";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { PUBLIC_ISR_REVALIDATE_SECONDS } from "@/src/lib/cache/constants";
import { getVisitorContextForPublicPage } from "@/src/lib/visitors/serverVisitorContext";

export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const host = req.headers.get("host") || "";
  if (host.startsWith("localhost") || host.includes("127.0.0.1")) {
    return NextResponse.json({
      data: { isSpammer: false, visitorHint: null },
      meta: {}
    });
  }

  const ctx = await getVisitorContextForPublicPage(req.headers);

  return NextResponse.json(
    { data: ctx, meta: {} },
    {
      headers: {
        "Cache-Control": `private, max-age=${PUBLIC_ISR_REVALIDATE_SECONDS}, stale-while-revalidate=60`
      }
    }
  );
}
