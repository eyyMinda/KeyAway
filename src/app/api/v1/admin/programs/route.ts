import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { normalizeProgramFields, validateProgramFields, type ProgramFields } from "@/src/lib/admin/programFields";
import { afterProgramWrite, fetchProgramWriteResult, slugTakenByOtherProgram } from "@/src/lib/admin/programWrite";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { mutationClient } from "@/src/lib/sanity/mutationClient";
import { adminProgramListQuery, adminVendorListProjection } from "@/src/lib/sanity/queries";

/**
 * GET /api/v1/admin/programs - Programs and vendors list rows, plus the category options for the editor.
 * Server-side with the token: vendor docs use dotted ids (`vendor.iobit`), which Sanity keeps private
 * from unauthenticated (browser) queries.
 */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const data = await mutationClient.fetch(`{
      "programs": ${adminProgramListQuery},
      "vendors": *[_type == "vendor" && !(_id in path("drafts.**"))] | order(name asc)${adminVendorListProjection},
      "categories": *[_type == "programCategory" && !(_id in path("drafts.**"))] | order(title asc){ _id, title }
    }`);
    return NextResponse.json({ data, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/programs]", err);
    return Errors.internal();
  }
}

/**
 * POST /api/v1/admin/programs - Create program.
 * Body: `{ fields: { title, slug, vendor, description, … } }` in Sanity shapes (see `programFields.ts`).
 * Responds with the new editor doc and list row.
 */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const body = (await req.json().catch(() => ({}))) as { fields?: unknown };
    const { fields, unknown } = normalizeProgramFields(body.fields);
    if (unknown.length) return Errors.validation(`Unknown fields: ${unknown.join(", ")}`);

    const doc: ProgramFields = { platforms: ["windows"], programFlow: "cd_key", cdKeys: [], ...fields };
    const errors = validateProgramFields(doc);
    if (errors.length) return Errors.validation(errors[0].message, errors.map(e => ({ field: e.field, message: e.message })));

    const slug = (doc.slug as { current: string }).current;
    if (await slugTakenByOtherProgram(slug)) {
      return Errors.validation("A program with this slug already exists", [{ field: "slug", message: "Already exists" }]);
    }

    const values = Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== null));
    const created = await mutationClient.create({ _type: "program", ...values });

    await afterProgramWrite({ slug, sitemapChanged: true });
    return NextResponse.json({ data: await fetchProgramWriteResult(created._id), meta: {} }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/admin/programs]", err);
    return Errors.internal();
  }
}
