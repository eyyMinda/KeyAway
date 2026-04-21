import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

function isReference(value: unknown): value is { _ref: string } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "_ref" in value &&
      typeof (value as { _ref: string })._ref === "string"
  );
}

type HeaderDoc = { isLogo?: boolean; headerLinks?: unknown[] };
type FooterDoc = { isLogo?: boolean; footerLinks?: unknown[] };
type SocialRow = { platform: string; url: string };

/** POST — embed `header` / `footer` references and `socialLink` docs into `storeDetails`. */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = Boolean((body as { dryRun?: boolean }).dryRun);

    const ids = await client.fetch<string[]>(`*[_type == "storeDetails"]._id`);
    const id = ids[0];
    if (!id) return Errors.badRequest("No storeDetails document found");

    const doc = (await client.getDocument(id)) as Record<string, unknown> | null;
    if (!doc) return Errors.notFound("storeDetails document missing");

    const headerWasRef = isReference(doc.header);
    const footerWasRef = isReference(doc.footer);

    let header: unknown = doc.header;
    if (isReference(header)) {
      const h = (await client.getDocument(header._ref)) as HeaderDoc | null;
      header = { isLogo: h?.isLogo ?? true, headerLinks: h?.headerLinks ?? [] };
    } else if (!header || typeof header !== "object") {
      header = { isLogo: true, headerLinks: [] };
    }

    let footer: unknown = doc.footer;
    if (isReference(footer)) {
      const f = (await client.getDocument(footer._ref)) as FooterDoc | null;
      footer = { isLogo: f?.isLogo ?? true, footerLinks: f?.footerLinks ?? [] };
    } else if (!footer || typeof footer !== "object") {
      footer = { isLogo: true, footerLinks: [] };
    }

    const socialFromDocs = await client.fetch<SocialRow[]>(
      `*[_type == "socialLink"] | order(_createdAt asc){ platform, url }`
    );
    const existingSocial = Array.isArray(doc.socialLinks) ? (doc.socialLinks as SocialRow[]) : [];
    const socialLinks =
      existingSocial.length > 0 ? [...existingSocial] : socialFromDocs?.length ? [...socialFromDocs] : [];

    const needsSocialImport =
      existingSocial.length === 0 && (socialFromDocs?.length ?? 0) > 0 && socialLinks.length > 0;
    const needsPatch = headerWasRef || footerWasRef || needsSocialImport;

    if (!needsPatch) {
      return NextResponse.json({
        data: {
          dryRun,
          patched: false,
          message: "Nothing to migrate (header and footer already embedded; social links already set or none in CMS)."
        },
        meta: {}
      });
    }

    if (dryRun) {
      return NextResponse.json({
        data: {
          dryRun: true,
          patched: false,
          wouldSet: {
            header: headerWasRef,
            footer: footerWasRef,
            socialLinksCount: socialLinks.length
          }
        },
        meta: {}
      });
    }

    await client.patch(id).set({ header, footer, socialLinks }).commit();

    revalidatePath("/");
    revalidatePath("/programs");
    revalidatePath("/sitemap.xml");

    return NextResponse.json({
      data: {
        dryRun: false,
        patched: true,
        headerResolved: headerWasRef,
        footerResolved: footerWasRef,
        socialLinksCount: socialLinks.length
      },
      meta: {}
    });
  } catch (err) {
    console.error("[POST /api/v1/admin/migrate-store-details]", err);
    return Errors.internal();
  }
}
