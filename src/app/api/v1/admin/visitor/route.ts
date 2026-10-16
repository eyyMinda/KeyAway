/** @fileoverview Admin GET: visitor profile by `hash`, or tier/spam flags for a batch via `hashes=a,b,c`. */
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { fetchVisitorByHash, fetchVisitorsByHashes, type Visitor } from "@/src/lib/visitors/visitorStore";
import type { AdminCommentVisitor } from "@/src/types/admin/programComments";

const MAX_BATCH = 100;

function toAdminVisitor(v: Visitor): AdminCommentVisitor {
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
  const hashes = (req.nextUrl.searchParams.get("hashes") ?? "")
    .split(",")
    .map(h => h.trim())
    .filter(Boolean)
    .slice(0, MAX_BATCH);
  if (!hash && !hashes.length) return Errors.validation("hash or hashes query parameter required");

  try {
    if (hashes.length) {
      const map = await fetchVisitorsByHashes(hashes);
      const data = Object.fromEntries([...map].map(([h, v]) => [h, { visitTier: v.visitTier, isSpammer: v.isSpammer }]));
      return NextResponse.json({ data, meta: { count: map.size } });
    }
    const resolved = await fetchVisitorByHash(hash!);
    return NextResponse.json({
      data: resolved ? toAdminVisitor(resolved) : null,
      meta: { visitorHash: hash }
    });
  } catch (err) {
    console.error("[GET /api/v1/admin/visitor]", err);
    return Errors.internal();
  }
}
