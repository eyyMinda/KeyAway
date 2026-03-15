import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

const VALID_STATUSES = ["new", "active", "expired", "limit"] as const;

/** PATCH /api/v1/admin/key-reports - Update CD key status by programSlug + keyIndex */
export async function PATCH(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") return Errors.badRequest("Request body is required");

    const b = body as Record<string, unknown>;
    const programSlug = typeof b.programSlug === "string" ? b.programSlug.trim() : "";
    const keyIndex =
      typeof b.keyIndex === "number" ? b.keyIndex : parseInt(String(b.keyIndex ?? ""), 10);
    const newStatus = typeof b.newStatus === "string" ? b.newStatus.trim() : "";

    if (!programSlug || keyIndex < 0 || Number.isNaN(keyIndex) || !newStatus) {
      return Errors.validation("Missing required fields: programSlug, keyIndex, newStatus");
    }
    if (!VALID_STATUSES.includes(newStatus as (typeof VALID_STATUSES)[number])) {
      return Errors.validation(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const programDoc = await client.fetch<{ _id: string; cdKeys?: Array<{ key?: string; status?: string; _key?: string }> } | null>(
      `*[_type == "program" && slug.current == $slug][0]{ _id, cdKeys }`,
      { slug: programSlug }
    );
    if (!programDoc) return Errors.notFound(`Program not found for slug: ${programSlug}`);

    const cdKeys = programDoc.cdKeys ?? [];
    if (keyIndex < 0 || keyIndex >= cdKeys.length) {
      return Errors.validation(`Invalid keyIndex: ${keyIndex} (program has ${cdKeys.length} keys)`);
    }

    const updatedKeys = cdKeys.map((k, i) =>
      i === keyIndex ? { ...k, status: newStatus } : k
    );
    const result = await client.patch(programDoc._id).set({ cdKeys: updatedKeys }).commit();

    return NextResponse.json({ data: result, meta: {} });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/key-reports]", err);
    return Errors.internal();
  }
}
