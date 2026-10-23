import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { normalizeProgramFields, validateProgramFields } from "@/src/lib/admin/programFields";
import {
  afterProgramWrite,
  editableFieldsOf,
  fetchProgramEditorDoc,
  fetchProgramWriteResult,
  slugTakenByOtherProgram
} from "@/src/lib/admin/programWrite";
import { Errors, errorResponse } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { mutationClient } from "@/src/lib/sanity/mutationClient";

const conflict = () =>
  errorResponse(
    {
      code: "CONFLICT",
      message: "This program was changed elsewhere (Studio, a cron or another tab) since you opened it. Reload it to continue."
    },
    409
  );

/** GET /api/v1/admin/programs/[id] - Program as loaded into the admin editor (with `_rev` and `hasDraft`) */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    if (!id) return Errors.badRequest("id is required");

    const doc = await fetchProgramEditorDoc(id);
    if (!doc) return Errors.notFound("Program not found");

    return NextResponse.json({ data: doc, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/programs/[id]]", err);
    return Errors.internal();
  }
}

/**
 * PATCH /api/v1/admin/programs/[id] - Update the given fields only.
 * Body: `{ rev, fields }`. `rev` is the `_rev` the editor loaded; a newer revision answers 409 instead of
 * overwriting someone else's change. `null` field values unset the field.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    if (!id) return Errors.badRequest("id is required");

    const body = (await req.json().catch(() => ({}))) as { rev?: unknown; fields?: unknown };
    const { fields, unknown } = normalizeProgramFields(body.fields);
    if (unknown.length) return Errors.validation(`Unknown fields: ${unknown.join(", ")}`);
    if (Object.keys(fields).length === 0) return Errors.validation("No fields to update");

    const existing = await fetchProgramEditorDoc(id);
    if (!existing) return Errors.notFound("Program not found");
    if (typeof body.rev === "string" && body.rev !== existing._rev) return conflict();

    const errors = validateProgramFields({ ...editableFieldsOf(existing), ...fields });
    if (errors.length) return Errors.validation(errors[0].message, errors.map(e => ({ field: e.field, message: e.message })));

    const oldSlug = (existing.slug as { current?: string } | undefined)?.current ?? "";
    const nextSlug = fields.slug ? (fields.slug as { current: string }).current : oldSlug;
    if (nextSlug !== oldSlug && (await slugTakenByOtherProgram(nextSlug, id))) {
      return Errors.validation("Another program already uses this slug", [{ field: "slug", message: "Already exists" }]);
    }

    const set = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== null));
    const unset = Object.entries(fields)
      .filter(([, v]) => v === null)
      .map(([k]) => k);
    // The editor writes the nested `affiliatePro`; drop the legacy top-level copies it was read from.
    if ("affiliatePro" in fields) unset.push("affiliateProUrl", "affiliateProLabel");

    try {
      await mutationClient.patch(id).ifRevisionId(existing._rev).set(set).unset(unset).commit();
    } catch (err) {
      if ((err as { statusCode?: number }).statusCode === 409) return conflict();
      throw err;
    }

    await afterProgramWrite({ slug: nextSlug, previousSlug: oldSlug });
    return NextResponse.json({ data: await fetchProgramWriteResult(id), meta: {} });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/programs/[id]]", err);
    return Errors.internal();
  }
}

/** DELETE /api/v1/admin/programs/[id] - Delete program */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    if (!id) return Errors.badRequest("id is required");

    const existing = await mutationClient.fetch<{ _id: string; slug?: { current?: string } } | null>(
      `*[_type == "program" && _id == $id][0]{ _id, slug }`,
      { id }
    );
    if (!existing) return Errors.notFound("Program not found");
    const oldSlug = existing.slug?.current?.trim() || "";

    await mutationClient.delete(id);
    await afterProgramWrite({ previousSlug: oldSlug || undefined, sitemapChanged: true });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/v1/admin/programs/[id]]", err);
    return Errors.internal();
  }
}
