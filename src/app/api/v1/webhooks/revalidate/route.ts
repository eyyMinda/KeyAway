import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { Errors } from "@/src/lib/api/errors";
import {
  TAG_FEATURED_PROGRAM,
  TAG_HOMEPAGE_PROGRAMS,
  TAG_HOMEPAGE_STATS,
  TAG_NOTIFICATIONS,
  TAG_PROGRAM_LISTINGS,
  TAG_PROGRAMS_FULL,
  TAG_SITEMAP_URLS,
  TAG_STORE_DETAILS,
  programDetailTag
} from "@/src/lib/cache/cacheTags";

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

/** POST /api/v1/webhooks/revalidate - Sanity webhook: tag-scoped cache busts. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const secret = req.headers.get("sanity-webhook-secret");
    const bodySecret = body?.secret;

    const expected = process.env.SANITY_WEBHOOK_SECRET;
    if (expected && secret !== expected && bodySecret !== expected) {
      return Errors.unauthorized("Invalid webhook secret");
    }

    const t = body?._type as string | undefined;

    revalidateTag(TAG_NOTIFICATIONS, "max");
    revalidatePath("/api/v1/notifications/recent");

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

      if (t === "program") {
        const cur =
          typeof body.slug === "object" && body.slug !== null
            ? (body.slug as { current?: string }).current
            : typeof body.slug === "string"
              ? body.slug
              : undefined;
        if (cur) revalidateTag(programDetailTag(cur), "max");
      }

      if (t === "cdKey") {
        const parentSlug =
          typeof body.programSlug === "string"
            ? body.programSlug
            : typeof (body.program as { slug?: { current?: string } } | undefined)?.slug?.current === "string"
              ? (body.program as { slug: { current: string } }).slug.current
              : undefined;
        if (parentSlug) revalidateTag(programDetailTag(parentSlug), "max");
      }

      if (shouldBustSitemapUrlset(body)) {
        revalidateTag(TAG_SITEMAP_URLS, "max");
        revalidatePath("/sitemap.xml");
      }
    }

    return NextResponse.json({ data: { revalidated: true }, meta: {} });
  } catch (err) {
    console.error("[POST /api/v1/webhooks/revalidate]", err);
    return Errors.internal();
  }
}
