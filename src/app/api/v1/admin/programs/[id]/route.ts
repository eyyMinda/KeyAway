import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { revalidateAfterProgramContentWrite } from "@/src/lib/cache/revalidateProgramContent";
import { rebuildSiteNotificationFeed } from "@/src/lib/notifications/notificationFeed.server";
import { client } from "@/src/sanity/lib/client";
import { buildImageReference } from "@/src/lib/admin/adminHelpers";
import { plainTextToPortableText } from "@/src/lib/portableText/plainTextToPortableText";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { buildSiteUrl, submitIndexNow } from "@/src/lib/seo/indexnow";
import type { ProgramFlow } from "@/src/types/program";

const SLUG_REGEX = /^[a-z0-9-]+$/;
const URL_REGEX = /^https?:\/\/[^\s]+$/;
const PROGRAM_FLOWS: ProgramFlow[] = ["cd_key", "link_based_cdkey", "account", "link_based_account"];

function normalizeSlug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
}

function parseBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") return {};
  const b = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  if (b.title !== undefined) {
    const v = typeof b.title === "string" ? b.title.trim() : "";
    if (!v) throw new Error("title cannot be empty");
    out.title = v;
  }
  if (b.slug !== undefined) {
    const raw = typeof b.slug === "string" ? b.slug.trim() : "";
    if (!raw) throw new Error("slug cannot be empty");
    const slug = normalizeSlug(raw);
    if (!SLUG_REGEX.test(slug)) throw new Error("slug must contain only lowercase letters, numbers, and hyphens");
    out.slug = slug;
  }
  if (b.description !== undefined) {
    out.description = typeof b.description === "string" ? b.description.trim() : "";
  }
  if (b.programFlow !== undefined) {
    const v = typeof b.programFlow === "string" ? b.programFlow.trim() : "";
    if (!PROGRAM_FLOWS.includes(v as ProgramFlow)) throw new Error("programFlow must be a valid flow");
    out.programFlow = v;
  }
  if (b.featuredCopy !== undefined) {
    if (b.featuredCopy === null) {
      out.featuredCopy = null;
    } else if (typeof b.featuredCopy === "string") {
      const t = b.featuredCopy.trim();
      out.featuredCopy = t.length ? t : null;
    } else {
      out.featuredCopy = null;
    }
  }
  if (b.downloadLink !== undefined) {
    const v = typeof b.downloadLink === "string" ? b.downloadLink.trim() : "";
    if (v && !URL_REGEX.test(v)) throw new Error("downloadLink must be a valid URL");
    out.downloadLink = v || undefined;
  }
  if (b.imageAssetId !== undefined) {
    out.imageAssetId =
      b.imageAssetId === null || b.imageAssetId === ""
        ? null
        : typeof b.imageAssetId === "string"
          ? b.imageAssetId.trim() || null
          : undefined;
  }
  if (b.showcaseGifAssetId !== undefined) {
    out.showcaseGifAssetId =
      b.showcaseGifAssetId === null || b.showcaseGifAssetId === ""
        ? null
        : typeof b.showcaseGifAssetId === "string"
          ? b.showcaseGifAssetId.trim() || null
          : undefined;
  }
  return out;
}

/** GET /api/v1/admin/programs/[id] - Get single program */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(_req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    if (!id) return Errors.badRequest("id is required");

    const doc = await client.fetch<unknown | null>(`*[_type == "program" && _id == $id][0]`, { id });
    if (!doc) return Errors.notFound("Program not found");

    return NextResponse.json({ data: doc, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/programs/[id]]", err);
    return Errors.internal();
  }
}

/** PATCH /api/v1/admin/programs/[id] - Update program */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    if (!id) return Errors.badRequest("id is required");
    const existingProgram = await client.fetch<{ slug?: { current?: string } } | null>(
      `*[_type == "program" && _id == $id][0]{ slug }`,
      { id }
    );
    if (!existingProgram) return Errors.notFound("Program not found");
    const oldSlug = existingProgram.slug?.current?.trim() || "";

    const body = await req.json().catch(() => ({}));
    const updates = parseBody(body);
    const keys = Object.keys(updates);
    if (keys.length === 0) {
      return Errors.validation(
        "No valid fields to update (allowed: title, slug, description, programFlow, featuredCopy, downloadLink, imageAssetId, showcaseGifAssetId)"
      );
    }

    if (updates.slug) {
      const duplicate = await client.fetch<string | null>(
        `*[_type == "program" && slug.current == $slug && _id != $id][0]._id`,
        { slug: updates.slug, id }
      );
      if (duplicate) {
        return Errors.validation("Another program already uses this slug", [
          { field: "slug", message: "Already exists" }
        ]);
      }
    }

    const patch = client.patch(id);
    if (updates.title !== undefined) patch.set({ title: updates.title as string });
    if (updates.slug !== undefined) patch.set({ slug: { _type: "slug", current: updates.slug as string } });
    if (updates.description !== undefined) {
      patch.set({ description: plainTextToPortableText(updates.description as string) });
    }
    if (updates.programFlow !== undefined) patch.set({ programFlow: updates.programFlow as ProgramFlow });
    if (updates.downloadLink !== undefined) patch.set({ downloadLink: (updates.downloadLink as string) ?? null });
    if (updates.imageAssetId !== undefined) {
      patch.set({ image: buildImageReference(updates.imageAssetId as string | null) });
    }
    if (updates.featuredCopy !== undefined || updates.showcaseGifAssetId !== undefined) {
      type FeaturedRow = {
        featured?: { description?: unknown; showcaseGif?: unknown } | null;
      };
      const row = await client.fetch<FeaturedRow | null>(`*[_type == "program" && _id == $id][0]{ featured }`, { id });
      const rawDesc = row?.featured?.description;
      const prevDesc =
        typeof rawDesc === "string" ? plainTextToPortableText(rawDesc) : Array.isArray(rawDesc) ? rawDesc : [];
      const prevGif = row?.featured?.showcaseGif ?? null;
      const nextDescription =
        updates.featuredCopy !== undefined
          ? updates.featuredCopy === null || (typeof updates.featuredCopy === "string" && !updates.featuredCopy.trim())
            ? []
            : plainTextToPortableText(updates.featuredCopy as string)
          : prevDesc;
      const nextFeatured = {
        description: nextDescription,
        showcaseGif:
          updates.showcaseGifAssetId !== undefined
            ? buildImageReference(updates.showcaseGifAssetId as string | null)
            : prevGif
      };
      patch.set({ featured: nextFeatured });
    }

    const result = await patch.commit();
    const nextSlug = typeof updates.slug === "string" ? updates.slug : oldSlug;
    const slugRenamed = typeof updates.slug === "string" && updates.slug !== oldSlug;
    revalidateAfterProgramContentWrite({
      slug: nextSlug,
      previousSlug: oldSlug && oldSlug !== nextSlug ? oldSlug : undefined,
      invalidateSitemap: slugRenamed
    });
    await rebuildSiteNotificationFeed();
    const urls = [buildSiteUrl(`/program/${nextSlug}`), buildSiteUrl("/programs"), buildSiteUrl("/")];
    if (oldSlug && oldSlug !== nextSlug) urls.push(buildSiteUrl(`/program/${oldSlug}`));
    void submitIndexNow(urls);
    return NextResponse.json({ data: result, meta: {} });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update program";
    if (message.includes("cannot be empty") || message.includes("must be") || message.includes("already")) {
      return Errors.validation(message);
    }
    console.error("[PATCH /api/v1/admin/programs/[id]]", err);
    return Errors.internal();
  }
}

/** DELETE /api/v1/admin/programs/[id] - Delete program */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(_req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    if (!id) return Errors.badRequest("id is required");

    const existing = await client.fetch<{ _id: string; slug?: { current?: string } } | null>(
      `*[_type == "program" && _id == $id][0]{ _id, slug }`,
      { id }
    );
    if (!existing) return Errors.notFound("Program not found");
    const oldSlug = existing.slug?.current?.trim() || "";

    await client.delete(id);
    revalidateAfterProgramContentWrite({ previousSlug: oldSlug || undefined, invalidateSitemap: true });
    await rebuildSiteNotificationFeed();
    const urls = [buildSiteUrl("/programs"), buildSiteUrl("/")];
    if (oldSlug) urls.push(buildSiteUrl(`/program/${oldSlug}`));
    void submitIndexNow(urls);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/v1/admin/programs/[id]]", err);
    return Errors.internal();
  }
}
