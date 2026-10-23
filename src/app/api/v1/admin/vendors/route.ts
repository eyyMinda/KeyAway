import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { normalizeVendorFields, validateVendorFields } from "@/src/lib/admin/vendorFields";
import { afterVendorWrite, fetchVendorWriteResult, vendorSlugTaken } from "@/src/lib/admin/vendorWrite";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { mutationClient } from "@/src/lib/sanity/mutationClient";

/** POST /api/v1/admin/vendors - Create vendor. Body: `{ fields }` (see `vendorFields.ts`). */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const body = (await req.json().catch(() => ({}))) as { fields?: unknown };
    const { fields, unknown } = normalizeVendorFields(body.fields);
    if (unknown.length) return Errors.validation(`Unknown fields: ${unknown.join(", ")}`);

    const errors = validateVendorFields(fields);
    if (errors.length) return Errors.validation(errors[0].message, errors);

    const slug = (fields.slug as { current: string }).current;
    if (await vendorSlugTaken(slug)) {
      return Errors.validation("A vendor with this slug already exists", [{ field: "slug", message: "Already exists" }]);
    }

    const values = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== null));
    const created = await mutationClient.create({ _type: "vendor", ...values });
    afterVendorWrite();
    return NextResponse.json({ data: await fetchVendorWriteResult(created._id), meta: {} }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/admin/vendors]", err);
    return Errors.internal();
  }
}
