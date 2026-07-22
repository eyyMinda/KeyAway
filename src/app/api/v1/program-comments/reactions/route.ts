import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { isLikelyBotUserAgent } from "@/src/lib/api/botUserAgent";
import { getClientIp, hashIp } from "@/src/lib/api/requestGeo";
import { isDevelopmentEnv } from "@/src/lib/env/isDevelopment";
import { isProgramSlugPublished } from "@/src/lib/sanity/programSlugExists";
import { fetchVisitorByHash } from "@/src/lib/visitors/visitorLookup";
import { MAX_REACTIONS_PER_VISITOR, sanitizeReactionEmoji } from "@/src/lib/program/commentReactions";
import {
  fetchProgramReactionSummaryMap,
  toggleCommentReaction,
  type ReactionTarget
} from "@/src/lib/program/toggleCommentReaction";

async function resolveProgramId(slug: string): Promise<string | null> {
  const program = await client.fetch<{ _id: string } | null>(
    `*[_type == "program" && slug.current == $slug][0]{ _id }`,
    { slug }
  );
  return program?._id ?? null;
}

/** GET /api/v1/program-comments/reactions?programSlug= — full summaries + reacted flags for this visitor */
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

  const published = await isProgramSlugPublished(programSlug);
  if (!published) return Errors.notFound("Program not found");

  const programId = await resolveProgramId(programSlug);
  if (!programId) return Errors.notFound("Program not found");

  const data = await fetchProgramReactionSummaryMap(programId, ipHash);

  return NextResponse.json({ data, meta: {} });
}

/** POST /api/v1/program-comments/reactions — toggle emoji on a comment or reply */
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

    const b = body as Record<string, unknown>;
    const programSlug = typeof b.programSlug === "string" ? b.programSlug.trim() : "";
    const commentKey = typeof b.commentKey === "string" ? b.commentKey.trim() : "";
    const replyKeyRaw = typeof b.replyKey === "string" ? b.replyKey.trim() : "";
    const replyKey = replyKeyRaw || undefined;
    const emoji = sanitizeReactionEmoji(b.emoji);

    if (!programSlug) {
      return Errors.validation("programSlug is required", [{ field: "programSlug", message: "Required" }]);
    }
    if (!commentKey) {
      return Errors.validation("commentKey is required", [{ field: "commentKey", message: "Required" }]);
    }
    if (!emoji) {
      return Errors.validation("emoji is required", [{ field: "emoji", message: "Invalid emoji" }]);
    }

    if (!isDev) {
      const visitor = await fetchVisitorByHash(ipHash);
      if (visitor?.isSpammer) {
        return Errors.validation("Reacting is disabled for your network.", [
          { field: "emoji", message: "Reacting disabled" }
        ]);
      }
    }

    const published = await isProgramSlugPublished(programSlug);
    if (!published) return Errors.notFound("Program not found");

    const programId = await resolveProgramId(programSlug);
    if (!programId) return Errors.notFound("Program not found");

    if (replyKey) {
      const replyExists = await client.fetch<boolean>(
        `defined(*[_id == $id][0].programComments[_key == $commentKey][0].replies[_key == $replyKey][0])`,
        { id: programId, commentKey, replyKey }
      );
      if (!replyExists) {
        return Errors.validation("replyKey is invalid", [{ field: "replyKey", message: "Reply not found" }]);
      }
    } else {
      const commentExists = await client.fetch<boolean>(
        `defined(*[_id == $id][0].programComments[_key == $key][0])`,
        { id: programId, key: commentKey }
      );
      if (!commentExists) {
        return Errors.validation("commentKey is invalid", [{ field: "commentKey", message: "Comment not found" }]);
      }
    }

    const target: ReactionTarget = replyKey
      ? { kind: "reply", commentKey, replyKey }
      : { kind: "comment", commentKey };

    const result = await toggleCommentReaction({
      programId,
      target,
      emoji,
      ipHash
    });

    return NextResponse.json({
      data: {
        commentKey,
        replyKey: replyKey ?? null,
        storageKey: result.storageKey,
        action: result.action,
        reactions: result.reactions
      },
      meta: {}
    });
  } catch (err) {
    if (err instanceof Error && err.message === "REACTION_LIMIT") {
      return Errors.validation("This thread has reached the maximum number of reactions.");
    }
    if (err instanceof Error && err.message === "VISITOR_EMOJI_LIMIT") {
      return Errors.validation(
        `You can react with at most ${MAX_REACTIONS_PER_VISITOR} different emojis on one comment.`,
        [{ field: "emoji", message: "Too many emojis" }]
      );
    }
    console.error("[POST /api/v1/program-comments/reactions]", err);
    return Errors.internal();
  }
}
