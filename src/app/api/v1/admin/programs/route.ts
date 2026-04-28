import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
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

/** POST /api/v1/admin/programs - Create program */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") return Errors.badRequest("Request body is required");

    const b = body as Record<string, unknown>;

    const title = typeof b.title === "string" ? b.title.trim() : "";
    if (!title) return Errors.validation("title cannot be empty", [{ field: "title", message: "Required" }]);

    const slugRaw = typeof b.slug === "string" ? b.slug.trim() : "";
    if (!slugRaw) return Errors.validation("slug cannot be empty", [{ field: "slug", message: "Required" }]);
    const slug = normalizeSlug(slugRaw);
    if (!SLUG_REGEX.test(slug)) {
      return Errors.validation("slug must contain only lowercase letters, numbers, and hyphens", [
        { field: "slug", message: "Invalid format" }
      ]);
    }

    const description = typeof b.description === "string" ? b.description.trim() : "";
    if (!description)
      return Errors.validation("description cannot be empty", [{ field: "description", message: "Required" }]);

    const programFlow = typeof b.programFlow === "string" ? b.programFlow.trim() : "";
    if (!programFlow || !PROGRAM_FLOWS.includes(programFlow as ProgramFlow)) {
      return Errors.validation("programFlow is required and must be a valid flow", [
        { field: "programFlow", message: "Invalid value" }
      ]);
    }

    const featuredCopy = typeof b.featuredCopy === "string" ? b.featuredCopy.trim() : "";

    const downloadLinkRaw = typeof b.downloadLink === "string" ? b.downloadLink.trim() : "";
    if (downloadLinkRaw && !URL_REGEX.test(downloadLinkRaw)) {
      return Errors.validation("downloadLink must be a valid URL", [{ field: "downloadLink", message: "Invalid URL" }]);
    }
    const downloadLink = downloadLinkRaw || undefined;

    const imageAssetId =
      b.imageAssetId === null || b.imageAssetId === ""
        ? undefined
        : typeof b.imageAssetId === "string"
          ? b.imageAssetId.trim() || undefined
          : undefined;

    const showcaseGifAssetId =
      b.showcaseGifAssetId === null || b.showcaseGifAssetId === ""
        ? undefined
        : typeof b.showcaseGifAssetId === "string"
          ? b.showcaseGifAssetId.trim() || undefined
          : undefined;

    const duplicate = await client.fetch<string | null>(`*[_type == "program" && slug.current == $slug][0]._id`, {
      slug
    });
    if (duplicate) {
      return Errors.validation("A program with this slug already exists", [
        { field: "slug", message: "Already exists" }
      ]);
    }

    const featured: {
      description?: ReturnType<typeof plainTextToPortableText>;
      showcaseGif?: NonNullable<ReturnType<typeof buildImageReference>>;
    } = {};
    if (featuredCopy) featured.description = plainTextToPortableText(featuredCopy);
    const showcaseRef = buildImageReference(showcaseGifAssetId);
    if (showcaseRef) featured.showcaseGif = showcaseRef;

    const doc = await client.create({
      _type: "program",
      title,
      slug: { _type: "slug", current: slug },
      description: plainTextToPortableText(description),
      programFlow,
      ...(Object.keys(featured).length > 0 ? { featured } : {}),
      ...(downloadLink && { downloadLink }),
      ...(buildImageReference(imageAssetId) && { image: buildImageReference(imageAssetId) }),
      cdKeys: []
    });

    revalidatePath("/sitemap.xml");
    void submitIndexNow([buildSiteUrl(`/program/${slug}`), buildSiteUrl("/programs"), buildSiteUrl("/")]);
    return NextResponse.json({ data: doc, meta: {} }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/admin/programs]", err);
    return Errors.internal();
  }
}
