import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { checkCommentRateLimit } from "@/src/lib/api/commentRateLimit";
import { isLikelyBotUserAgent } from "@/src/lib/api/botUserAgent";
import { getClientIp, hashIp } from "@/src/lib/api/requestGeo";
import { revalidateAfterProgramContentWrite } from "@/src/lib/cache/revalidateProgramContent";
import { appendProgramComment } from "@/src/lib/program/appendProgramComment";
import { moderateCommentInput } from "@/src/lib/program/moderateComment";
import {
  MAX_COMMENT_AUTHOR,
  MAX_COMMENT_BODY,
  sanitizeCommentAuthor,
  sanitizeCommentBody
} from "@/src/lib/program/commentBody";
import { isProgramSlugPublished } from "@/src/lib/sanity/programSlugExists";
import { fetchVisitorByHash } from "@/src/lib/visitors/visitorLookup";
import { upsertVisitorContribution } from "@/src/lib/visitors/upsertVisitorContribution";
import { isDevelopmentEnv } from "@/src/lib/env/isDevelopment";
import { getAdminSession } from "@/src/lib/admin/adminAuth";
import { STAFF_COMMENT_AUTHOR_NAME, STAFF_COMMENT_AUTHOR_ROLE } from "@/src/lib/program/staffCommentIdentity";

const DUPLICATE_WINDOW_MS = 2 * 60_000;

/** POST /api/v1/program-comments — append a comment or reply on a program document */
export async function POST(req: NextRequest) {
  const isDev = isDevelopmentEnv();

  if (!isDev && isLikelyBotUserAgent(req.headers.get("user-agent"))) {
    return Errors.badRequest("Automated requests are not allowed");
  }

  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  try {
    const ipHash = hashIp(getClientIp(req)) ?? (isDev ? "dev-local" : undefined);
    if (!ipHash) return Errors.badRequest("Unable to process request");

    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") return Errors.badRequest("Request body is required");

    const admin = await getAdminSession();
    const isStaffComment = admin !== null;

    const b = body as Record<string, unknown>;
    const programSlug = typeof b.programSlug === "string" ? b.programSlug.trim() : "";
    const authorName = isStaffComment
      ? STAFF_COMMENT_AUTHOR_NAME
      : sanitizeCommentAuthor(typeof b.authorName === "string" ? b.authorName : "");
    const authorRole = isStaffComment ? STAFF_COMMENT_AUTHOR_ROLE : undefined;
    const commentBody = sanitizeCommentBody(typeof b.body === "string" ? b.body : "");
    const honeypot = typeof b.website === "string" ? b.website : "";
    const parentCommentKey =
      typeof b.parentCommentKey === "string" && b.parentCommentKey.trim() ? b.parentCommentKey.trim() : undefined;

    if (!programSlug)
      return Errors.validation("programSlug is required", [{ field: "programSlug", message: "Required" }]);
    if (!authorName) return Errors.validation("authorName is required", [{ field: "authorName", message: "Required" }]);
    if (!commentBody) return Errors.validation("body is required", [{ field: "body", message: "Required" }]);
    if (authorName.length > MAX_COMMENT_AUTHOR)
      return Errors.validation("authorName is too long", [{ field: "authorName", message: "Too long" }]);
    if (commentBody.length > MAX_COMMENT_BODY)
      return Errors.validation("body is too long", [{ field: "body", message: "Too long" }]);

    const moderation = moderateCommentInput({ authorName, body: commentBody, honeypot });
    if (!moderation.ok) {
      return Errors.validation(moderation.message, [
        { field: moderation.field ?? "body", message: moderation.message }
      ]);
    }

    const commentRate = checkCommentRateLimit(req, programSlug);
    if (!commentRate.ok) {
      return Errors.validation(commentRate.reason ?? "Rate limit exceeded", [
        { field: "body", message: commentRate.reason ?? "Rate limit exceeded" }
      ]);
    }

    if (!isDev && !isStaffComment) {
      const visitor = await fetchVisitorByHash(ipHash);
      if (visitor?.isSpammer) {
        return Errors.validation("Commenting is disabled for your network.", [
          { field: "body", message: "Commenting disabled" }
        ]);
      }
    }

    const published = await isProgramSlugPublished(programSlug);
    if (!published) return Errors.notFound("Program not found");

    const program = await client.fetch<{ _id: string } | null>(
      `*[_type == "program" && slug.current == $slug][0]{ _id }`,
      { slug: programSlug }
    );
    if (!program?._id) return Errors.notFound("Program not found");

    if (!isStaffComment) {
      const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
      const isDuplicate = await client.fetch<boolean>(
        `defined(*[_id == $id][0].programComments[
          ipHash == $h && body == $text && createdAt > $since
        ][0])`,
        { id: program._id, h: ipHash, text: commentBody, since }
      );
      if (isDuplicate) {
        return Errors.validation("You already posted this comment recently.", [
          { field: "body", message: "Duplicate" }
        ]);
      }
    }

    if (parentCommentKey) {
      const parentExists = await client.fetch<boolean>(`defined(*[_id == $id][0].programComments[_key == $key][0])`, {
        id: program._id,
        key: parentCommentKey
      });
      if (!parentExists)
        return Errors.validation("parentCommentKey is invalid", [
          { field: "parentCommentKey", message: "Comment not found" }
        ]);
    }

    const result = await appendProgramComment({
      programId: program._id,
      authorName,
      authorRole,
      body: commentBody,
      ipHash,
      parentCommentKey
    });

    if (!isStaffComment) {
      try {
        await upsertVisitorContribution(ipHash, "comment");
      } catch (e) {
        console.error("[POST /api/v1/program-comments] visitor contribution upsert failed", e);
      }
    }

    revalidateAfterProgramContentWrite({ slug: programSlug });

    return NextResponse.json({ data: result, meta: {} }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "COMMENT_LIMIT") {
      return Errors.validation("This program has reached the maximum number of comments.");
    }
    console.error("[POST /api/v1/program-comments]", err);
    return Errors.internal();
  }
}
