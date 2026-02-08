import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";

const VALID_STATUSES = ["new", "read", "replied", "archived"] as const;

export async function POST(request: NextRequest) {
  try {
    const { messageId, newStatus } = await request.json();

    if (!messageId || !newStatus) {
      return NextResponse.json({ error: "Missing messageId or newStatus" }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    await client.patch(messageId).set({ status: newStatus }).commit();

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Error updating message status:", error);
    return NextResponse.json({ error: "Failed to update message status" }, { status: 500 });
  }
}
