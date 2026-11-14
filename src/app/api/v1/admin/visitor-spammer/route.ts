/** @fileoverview Admin PATCH: set a visitor's spam flag by visitorHash (blocks negative public key reports). */
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { TAG_KEY_REVIEW } from "@/src/lib/admin/keyReview.server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { setVisitorSpammer } from "@/src/lib/visitors/visitorStore";

export async function PATCH(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const body = await req.json().catch(() => ({}));
    const b = body as Record<string, unknown>;
    const visitorHash = typeof b.visitorHash === "string" ? b.visitorHash.trim() : "";
    const isSpammer = b.isSpammer === true;

    if (!visitorHash) return Errors.validation("visitorHash required");

    const found = await setVisitorSpammer(visitorHash, isSpammer);
    if (!found) return Errors.notFound("No visitor for this hash");

    revalidateTag(TAG_KEY_REVIEW, { expire: 0 });
    return NextResponse.json({ data: { ok: true, visitorHash, isSpammer }, meta: {} });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/visitor-spammer]", err);
    return Errors.internal();
  }
}
