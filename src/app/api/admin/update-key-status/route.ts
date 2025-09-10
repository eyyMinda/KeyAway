import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";

export async function POST(request: NextRequest) {
  try {
    const { programSlug, keyIndex, newStatus } = await request.json();

    // Validate required fields
    if (!programSlug || keyIndex === undefined || !newStatus) {
      return NextResponse.json({ error: "Missing required fields: programSlug, keyIndex, newStatus" }, { status: 400 });
    }

    // Validate status value
    const validStatuses = ["new", "active", "expired", "limit"];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status value. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // First, get the document ID using a query
    const programDoc = await client.fetch(`*[_type == "program" && slug.current == "${programSlug}"][0]`);

    if (!programDoc) {
      return NextResponse.json({ error: `Program not found for slug: ${programSlug}` }, { status: 404 });
    }

    // Update the key status in Sanity
    const result = await client
      .patch(programDoc._id)
      .set({
        [`cdKeys[${keyIndex}].status`]: newStatus
      })
      .commit();

    return NextResponse.json({
      success: true,
      result,
      message: `Successfully updated key status to ${newStatus}`
    });
  } catch (error) {
    console.error("Error updating key status:", error);
    return NextResponse.json({ error: "Failed to update key status" }, { status: 500 });
  }
}
