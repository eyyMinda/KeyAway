import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

const VALID_STATUSES = ["new", "active", "expired", "limit"] as const;

/** PATCH /api/v1/admin/key-reports - Update CD key status by programSlug + keyIndex */
export async function PATCH(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const { isAdmin } = await checkAdminAccess();
  if (!isAdmin) return Errors.unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") return Errors.badRequest("Request body is required");

    const b = body as Record<string, unknown>;
    const programSlug = typeof b.programSlug === "string" ? b.programSlug.trim() : "";
    const keyIndex = b.keyIndex;
    const newStatus = typeof b.newStatus === "string" ? b.newStatus.trim() : "";

    if (!programSlug || keyIndex === undefined || !newStatus) {
      return Errors.validation("Missing required fields: programSlug, keyIndex, newStatus");
    }
    if (!VALID_STATUSES.includes(newStatus as (typeof VALID_STATUSES)[number])) {
      return Errors.validation(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const programDoc = await client.fetch<{ _id: string } | null>(
      `*[_type == "program" && slug.current == $slug][0]{ _id }`,
      { slug: programSlug }
    );
    if (!programDoc) return Errors.notFound(`Program not found for slug: ${programSlug}`);

    const result = await client
      .patch(programDoc._id)
      .set({ [`cdKeys[${keyIndex}].status`]: newStatus })
      .commit();

    return NextResponse.json({ data: result, meta: {} });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/key-reports]", err);
    return Errors.internal();
  }
}
