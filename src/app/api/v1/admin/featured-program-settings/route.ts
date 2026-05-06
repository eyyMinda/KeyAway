import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { TAG_FEATURED_PROGRAM } from "@/src/lib/cache/cacheTags";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { featuredProgramSettingsQuery } from "@/src/lib/sanity/queries";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

/** GET /api/v1/admin/featured-program-settings */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const data = await client.fetch(featuredProgramSettingsQuery);
    return NextResponse.json({ data: data ?? null, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/featured-program-settings]", err);
    return Errors.internal();
  }
}

/** PATCH /api/v1/admin/featured-program-settings */
export async function PATCH(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") return Errors.badRequest("Request body is required");

    const b = body as Record<string, unknown>;
    const rotationSchedule = b.rotationSchedule as "weekly" | "biweekly" | "monthly" | undefined;
    const autoSelectCriteria = b.autoSelectCriteria as "highest_working_keys" | "most_popular" | "random" | undefined;
    const currentFeaturedProgramId =
      b.currentFeaturedProgramId === null || b.currentFeaturedProgramId === ""
        ? null
        : typeof b.currentFeaturedProgramId === "string"
          ? b.currentFeaturedProgramId.trim() || null
          : undefined;

    const existing = await client.fetch<{ _id: string } | null>(`*[_type == "featuredProgramSettings"][0]{ _id }`);

    const updates: Record<string, unknown> = {};
    if (rotationSchedule !== undefined) updates.rotationSchedule = rotationSchedule;
    if (autoSelectCriteria !== undefined) updates.autoSelectCriteria = autoSelectCriteria;
    if (currentFeaturedProgramId !== undefined) {
      if (currentFeaturedProgramId) {
        updates.currentFeaturedProgram = { _type: "reference", _ref: currentFeaturedProgramId };
        updates.lastRotationDate = new Date().toISOString();
      } else {
        updates.currentFeaturedProgram = null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return Errors.validation("No fields to update");
    }

    let result;
    if (existing?._id) {
      const patch = client.patch(existing._id);
      Object.entries(updates).forEach(([key, value]) => {
        patch.set({ [key]: value });
      });
      result = await patch.commit();
    } else {
      result = await client.create({
        _type: "featuredProgramSettings",
        rotationSchedule: rotationSchedule || "weekly",
        autoSelectCriteria: autoSelectCriteria || "highest_working_keys",
        ...updates
      });
    }

    revalidateTag(TAG_FEATURED_PROGRAM, "max");
    return NextResponse.json({ data: result, meta: {} });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/featured-program-settings]", err);
    return Errors.internal();
  }
}
