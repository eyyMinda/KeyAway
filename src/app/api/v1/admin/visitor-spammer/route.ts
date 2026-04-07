/** @fileoverview Admin PATCH: set `visitor.isSpammer` by visitorHash (blocks public key reports). */
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { resolveVisitTier } from "@/src/lib/visitors/visitTier";

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

    const now = new Date().toISOString();
    const docId = await client.fetch<string | null>(`*[_type == "visitor" && visitorHash == $h][0]._id`, {
      h: visitorHash
    });

    if (!docId) {
      if (!isSpammer) return Errors.notFound("No visitor document for this hash");
      await client.create({
        _type: "visitor",
        visitorHash,
        visitCount: 0,
        lastActivityAt: now,
        visitTier: "new",
        isSpammer: true,
        reportCount: 0,
        suggestionCount: 0,
        contributionScore: 0,
        spamMarkedAt: now,
        createdAt: now,
        updatedAt: now
      });
      return NextResponse.json({ data: { ok: true, visitorHash, isSpammer: true }, meta: {} });
    }

    const current = await client.fetch<{ visitCount?: number; contributionScore?: number } | null>(
      `*[_type == "visitor" && _id == $id][0]{ visitCount, contributionScore }`,
      { id: docId }
    );
    const visitCount = current?.visitCount ?? 0;
    const contributionScore = current?.contributionScore ?? 0;
    const visitTier = resolveVisitTier(visitCount, contributionScore, isSpammer);

    if (isSpammer) {
      await client.patch(docId).set({ isSpammer: true, spamMarkedAt: now, visitTier, updatedAt: now }).commit();
    } else {
      await client
        .patch(docId)
        .set({ isSpammer: false, visitTier, updatedAt: now })
        .unset(["spamMarkedAt"])
        .commit();
    }

    return NextResponse.json({ data: { ok: true, visitorHash, isSpammer }, meta: {} });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/visitor-spammer]", err);
    return Errors.internal();
  }
}
