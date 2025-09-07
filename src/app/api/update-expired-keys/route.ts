import { updateAllExpiredKeys } from "@/src/lib/sanityActions";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await updateAllExpiredKeys();
    return NextResponse.json({
      success: true,
      message: "Expired keys updated successfully"
    });
  } catch (error) {
    console.error("Error updating expired keys:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update expired keys",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST method to update expired keys"
  });
}
