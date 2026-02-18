/** @fileoverview API route for updating featured program settings. Handles rotation schedule, auto-select criteria, and current featured program. */

import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { requireAdminAccess } from "@/src/lib/adminAuth";

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminAccess();

    const body = await request.json().catch(() => ({}));
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    const {
      rotationSchedule,
      autoSelectCriteria,
      currentFeaturedProgramId
    }: {
      rotationSchedule?: "weekly" | "biweekly" | "monthly";
      autoSelectCriteria?: "highest_working_keys" | "most_popular" | "random";
      currentFeaturedProgramId?: string | null;
    } = body;

    const existing = await client.fetch(`*[_type == "featuredProgramSettings"][0]{ _id }`);

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
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
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

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update featured program settings";
    const status = message.includes("required") || message.includes("No fields") ? 400 : 500;
    if (status === 500) console.error("Error updating featured program settings:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
