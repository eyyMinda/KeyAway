/** @fileoverview Admin GET: resolve visitor profile by visitorHash / ipHash. */
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { fetchVisitorByHash } from "@/src/lib/visitors/visitorLookup";
import type { AdminCommentVisitor } from "@/src/types/admin/programComments";

function toAdminVisitor(
  v: NonNullable<Awaited<ReturnType<typeof fetchVisitorByHash>>>
): AdminCommentVisitor {
  return {
    visitTier: v.visitTier,
    isSpammer: v.isSpammer,
    visitCount: v.visitCount,
    reportCount: v.reportCount,
    suggestionCount: v.suggestionCount,
    commentCount: v.commentCount,
    contributionScore: v.contributionScore,
    country: v.country,
    city: v.city,
    lastActivityAt: v.lastActivityAt
  };
}

export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  const hash = req.nextUrl.searchParams.get("hash")?.trim();
  if (!hash) return Errors.validation("hash query parameter required");

  try {
    const resolved = await fetchVisitorByHash(hash);
    return NextResponse.json({
      data: resolved ? toAdminVisitor(resolved) : null,
      meta: { visitorHash: hash, source: resolved?.source ?? null }
    });
  } catch (err) {
    console.error("[GET /api/v1/admin/visitor]", err);
    return Errors.internal();
  }
}
