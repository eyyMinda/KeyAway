import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { flattenProgramCommentsForAdmin } from "@/src/lib/admin/flattenProgramComments";
import { revalidateAfterProgramContentWrite } from "@/src/lib/cache/revalidateProgramContent";
import { removeProgramComment } from "@/src/lib/program/removeProgramComment";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { client } from "@/src/sanity/lib/client";
import { adminProgramsWithCommentsQuery } from "@/src/lib/sanity/queries";
import type { AdminCommentVisitor } from "@/src/types/admin/programComments";
import type { Program } from "@/src/types/program";

const VISITOR_FIELDS = `visitorHash, isSpammer, visitTier, visitCount, reportCount, suggestionCount, commentCount, contributionScore, country, city, lastActivityAt`;

/** GET /api/v1/admin/comments — flattened comment rows */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const programs = await client.fetch<Program[]>(adminProgramsWithCommentsQuery);
    const hashes = new Set<string>();
    for (const p of programs) {
      for (const c of p.programComments ?? []) {
        if (c.ipHash?.trim()) hashes.add(c.ipHash.trim());
        for (const r of c.replies ?? []) {
          if (r.ipHash?.trim()) hashes.add(r.ipHash.trim());
        }
      }
    }

    const visitorRows =
      hashes.size > 0
        ? await client.fetch<
            Array<{ visitorHash: string } & AdminCommentVisitor>
          >(`*[_type == "visitor" && visitorHash in $hashes]{ ${VISITOR_FIELDS} }`, {
            hashes: [...hashes]
          })
        : [];

    const visitorByHash: Record<string, AdminCommentVisitor> = {};
    for (const v of visitorRows) {
      if (!v.visitorHash) continue;
      const { visitorHash: _h, ...meta } = v;
      visitorByHash[v.visitorHash] = meta;
    }

    const rows = flattenProgramCommentsForAdmin(programs, visitorByHash);
    return NextResponse.json({ data: rows, meta: { total: rows.length } });
  } catch (err) {
    console.error("[GET /api/v1/admin/comments]", err);
    return Errors.internal();
  }
}

/** DELETE /api/v1/admin/comments — remove a comment or reply */
export async function DELETE(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const body = await req.json().catch(() => ({}));
    const b = body as Record<string, unknown>;
    const programId = typeof b.programId === "string" ? b.programId.trim() : "";
    const programSlug = typeof b.programSlug === "string" ? b.programSlug.trim() : "";
    const commentKey = typeof b.commentKey === "string" ? b.commentKey.trim() : "";
    const parentCommentKey =
      typeof b.parentCommentKey === "string" && b.parentCommentKey.trim()
        ? b.parentCommentKey.trim()
        : undefined;

    if (!programId || !commentKey) {
      return Errors.validation("programId and commentKey are required");
    }

    await removeProgramComment({
      programId,
      commentKey: parentCommentKey ?? commentKey,
      replyKey: parentCommentKey ? commentKey : undefined
    });

    if (programSlug) revalidateAfterProgramContentWrite({ slug: programSlug });

    return NextResponse.json({ data: { ok: true }, meta: {} });
  } catch (err) {
    console.error("[DELETE /api/v1/admin/comments]", err);
    return Errors.internal();
  }
}
