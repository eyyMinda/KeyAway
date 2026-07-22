import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { isLikelyBotUserAgent } from "@/src/lib/api/botUserAgent";
import { getClientIp, hashIp } from "@/src/lib/api/requestGeo";
import { isDevelopmentEnv } from "@/src/lib/env/isDevelopment";
import { isProgramSlugPublished } from "@/src/lib/sanity/programSlugExists";
import { fetchProgramCommentOwnership } from "@/src/lib/program/programCommentOwnership";

async function resolveProgramId(slug: string): Promise<string | null> {
  const program = await client.fetch<{ _id: string } | null>(
    `*[_type == "program" && slug.current == $slug][0]{ _id }`,
    { slug }
  );
  return program?._id ?? null;
}

/** GET /api/v1/program-comments/ownership?programSlug= — comment/reply keys owned by this visitor */
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

  const data = await fetchProgramCommentOwnership(programId, ipHash);

  return NextResponse.json({ data, meta: {} });
}
