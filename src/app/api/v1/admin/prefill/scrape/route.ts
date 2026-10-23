import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { collectPrefillSources } from "@/src/lib/prefill/collectSources";

export const maxDuration = 60;

/**
 * POST /api/v1/admin/prefill/scrape - Scrape vendor pages, the vendor's press kit and installer for the
 * editor's Prefill dialog. Body: `{ urls: string[], productName?: string }` (first URL = product or vendor
 * page; a .zip URL is read as a press kit).
 */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  const body = (await req.json().catch(() => ({}))) as { urls?: unknown; productName?: unknown };
  const urls = (Array.isArray(body.urls) ? body.urls : []).filter(
    (u): u is string => typeof u === "string" && /^https?:\/\/[^\s]+$/i.test(u.trim())
  );
  if (!urls.length) return Errors.validation("Enter at least one http(s) URL");

  try {
    const scrape = await collectPrefillSources({
      urls,
      productName: typeof body.productName === "string" ? body.productName : undefined
    });
    return NextResponse.json({ data: scrape, meta: {} });
  } catch (err) {
    console.error("[POST /api/v1/admin/prefill/scrape]", err);
    return Errors.internal();
  }
}
