import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import {
  TAG_FEATURED_PROGRAM,
  TAG_HOMEPAGE_PROGRAMS,
  TAG_HOMEPAGE_STATS,
  TAG_PROGRAM_LISTINGS,
  TAG_PROGRAMS_FULL,
  TAG_SITEMAP_URLS,
  TAG_STORE_DETAILS,
  programDetailTag
} from "@/src/lib/cache/cacheTags";
import { rebuildSiteNotificationFeed } from "@/src/lib/notifications/notificationFeed.server";
import { client } from "@/src/sanity/lib/client";

const MAX_WEBHOOK_BODY_BYTES = 512_000;

/** Best-effort: bust sitemap slug inventory when URL set likely changed (not FAQ-only edits). */
function shouldBustSitemapUrlset(body: Record<string, unknown>): boolean {
  if (body._type !== "program") return false;
  if (body.slugChanged === true) return true;
  const op = String(body.operation ?? body.transition ?? "").toLowerCase();
  if (["create", "delete", "unpublish"].includes(op)) return true;
  const c = body._createdAt;
  const u = body._updatedAt;
  if (typeof c === "string" && typeof u === "string" && c === u) return true;
  return false;
}

async function resolveProgramSlugForWebhook(body: Record<string, unknown>): Promise<string | undefined> {
  if (typeof body.slug === "object" && body.slug !== null) {
    const cur = (body.slug as { current?: string }).current;
    if (cur) return cur;
  }
  if (typeof body.slug === "string" && body.slug.trim()) return body.slug.trim();
  const id = typeof body._id === "string" ? body._id : undefined;
  if (!id) return undefined;
  try {
    const slug = await client.fetch<string | null>(
      `*[_id == $id][0].slug.current`,
      { id },
      { cache: "no-store" }
    );
    return slug ?? undefined;
  } catch {
    return undefined;
  }
}

/** POST /api/v1/webhooks/revalidate - Sanity webhook: tag-scoped cache busts. */
export async function POST(req: NextRequest) {
  const started = Date.now();
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  try {
    const len = Number(req.headers.get("content-length") || 0);
    if (len > MAX_WEBHOOK_BODY_BYTES) {
      return Errors.validation("request body too large");
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const secret = req.headers.get("sanity-webhook-secret");
    const bodySecret = body?.secret;

    const expected = process.env.SANITY_WEBHOOK_SECRET;
    if (expected && secret !== expected && bodySecret !== expected) {
      return Errors.unauthorized("Invalid webhook secret");
    }

    const t = body?._type as string | undefined;

    if (t === "storeDetails") {
      revalidateTag(TAG_STORE_DETAILS, "max");
    } else if (t === "keyReport") {
      revalidateTag(TAG_HOMEPAGE_STATS, "max");
    } else if (t === "featuredProgramSettings") {
      revalidateTag(TAG_FEATURED_PROGRAM, "max");
    } else if (t === "program" || t === "cdKey") {
      revalidateTag(TAG_PROGRAMS_FULL, "max");
      revalidateTag(TAG_PROGRAM_LISTINGS, "max");
      revalidateTag(TAG_HOMEPAGE_PROGRAMS, "max");
      revalidateTag(TAG_HOMEPAGE_STATS, "max");
      revalidateTag(TAG_FEATURED_PROGRAM, "max");

      const slug = await resolveProgramSlugForWebhook(body);
      if (slug) revalidateTag(programDetailTag(slug), "max");

      if (shouldBustSitemapUrlset(body)) {
        revalidateTag(TAG_SITEMAP_URLS, "max");
        revalidatePath("/sitemap.xml");
      }

      await rebuildSiteNotificationFeed();
    }

    console.info("[webhooks/revalidate]", { _type: t, ms: Date.now() - started });
    return NextResponse.json({ data: { revalidated: true }, meta: {} });
  } catch (err) {
    console.error("[POST /api/v1/webhooks/revalidate]", err);
    return Errors.internal();
  }
}
