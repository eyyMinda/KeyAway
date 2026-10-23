import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { normalizeVendorFields, validateVendorFields } from "@/src/lib/admin/vendorFields";
import {
  afterVendorWrite,
  editableVendorFieldsOf,
  fetchVendorEditorDoc,
  fetchVendorWriteResult,
  vendorSlugTaken
} from "@/src/lib/admin/vendorWrite";
import { Errors, errorResponse } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { mutationClient } from "@/src/lib/sanity/mutationClient";

const conflict = () =>
  errorResponse(
    { code: "CONFLICT", message: "This vendor was changed elsewhere since you opened it. Reload it to continue." },
    409
  );

/** GET /api/v1/admin/vendors/[id] - Vendor as loaded into the admin editor */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    const doc = await fetchVendorEditorDoc(id);
    if (!doc) return Errors.notFound("Vendor not found");
    return NextResponse.json({ data: doc, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/vendors/[id]]", err);
    return Errors.internal();
  }
}

/** PATCH /api/v1/admin/vendors/[id] - Update the given fields. Body: `{ rev, fields }`; a stale `rev` answers 409. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as { rev?: unknown; fields?: unknown };
    const { fields, unknown } = normalizeVendorFields(body.fields);
    if (unknown.length) return Errors.validation(`Unknown fields: ${unknown.join(", ")}`);
    if (Object.keys(fields).length === 0) return Errors.validation("No fields to update");

    const existing = await fetchVendorEditorDoc(id);
    if (!existing) return Errors.notFound("Vendor not found");
    if (typeof body.rev === "string" && body.rev !== existing._rev) return conflict();

    const errors = validateVendorFields({ ...editableVendorFieldsOf(existing), ...fields });
    if (errors.length) return Errors.validation(errors[0].message, errors);

    const oldSlug = (existing.slug as { current?: string } | undefined)?.current ?? "";
    const nextSlug = fields.slug ? (fields.slug as { current: string }).current : oldSlug;
    if (nextSlug !== oldSlug && (await vendorSlugTaken(nextSlug, id))) {
      return Errors.validation("Another vendor already uses this slug", [{ field: "slug", message: "Already exists" }]);
    }

    const set = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== null));
    const unset = Object.entries(fields)
      .filter(([, v]) => v === null)
      .map(([k]) => k);
    try {
      await mutationClient.patch(id).ifRevisionId(existing._rev).set(set).unset(unset).commit();
    } catch (err) {
      if ((err as { statusCode?: number }).statusCode === 409) return conflict();
      throw err;
    }

    afterVendorWrite();
    return NextResponse.json({ data: await fetchVendorWriteResult(id), meta: {} });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/vendors/[id]]", err);
    return Errors.internal();
  }
}

/** DELETE /api/v1/admin/vendors/[id] - Delete a vendor that no program uses */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    const usedBy = await mutationClient.fetch<number>(`count(*[_type == "program" && references($id)])`, { id });
    if (usedBy > 0) {
      return Errors.validation(`${usedBy} program${usedBy === 1 ? " uses" : "s use"} this vendor. Move them to another vendor first.`);
    }
    await mutationClient.delete(id);
    afterVendorWrite();
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/v1/admin/vendors/[id]]", err);
    return Errors.internal();
  }
}
