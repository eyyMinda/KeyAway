import { NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { generateCDKeyId } from "@/src/lib/cdKeyIdUtils";

/**
 * CD Key ID Updater Webhook
 *
 * This webhook is triggered when CD keys are modified within a program document.
 * It automatically updates CD key IDs to include the proper validUntil date
 * in the format: key_{timestamp}_{validUntil}_{uuid8chars}
 *
 * Optimized to only trigger when cdKeys array changes, reducing webhook load.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verify this is a program document with CD keys
    if (body._type !== "program" || !body.cdKeys || body.cdKeys.length === 0) {
      return NextResponse.json({
        message: "Not a program with CD keys - webhook ignored",
        receivedType: body._type,
        hasCdKeys: !!body.cdKeys,
        cdKeyCount: body.cdKeys?.length || 0
      });
    }

    console.log(`[CD Key ID Updater] Processing CD keys in program: "${body.title}" (${body.cdKeys.length} keys)`);

    // Check if any CD keys need ID updates
    const needsUpdate = body.cdKeys.some(
      (key: { id?: string }) => !key.id || !key.id.startsWith("key_") || key.id.includes("000000")
    );

    if (!needsUpdate) {
      console.log(`[CD Key ID Updater] All CD keys already have proper IDs for "${body.title}"`);
      return NextResponse.json({
        message: "All CD keys already have proper IDs",
        programTitle: body.title,
        cdKeyCount: body.cdKeys.length
      });
    }

    // Update CD key IDs with proper validUntil dates
    const updatedKeys = body.cdKeys.map((key: { id?: string; key: string; validUntil?: string }) => {
      // Only update if ID is missing, malformed, or has placeholder validUntil
      if (!key.id || !key.id.startsWith("key_") || key.id.includes("000000")) {
        const newId = generateCDKeyId(key.key, key.validUntil);
        console.log(`[CD Key ID Updater] Updating ID: ${key.key.substring(0, 8)}... -> ${newId}`);
        return {
          ...key,
          id: newId
        };
      }
      return key;
    });

    // Update the program document
    await client.patch(body._id).set({ cdKeys: updatedKeys }).commit();

    const updatedCount = updatedKeys.filter(
      (key: { id?: string }) => key.id && key.id.includes("000000") === false
    ).length;
    console.log(`[CD Key ID Updater] Successfully updated ${updatedCount} CD keys for "${body.title}"`);

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedCount} CD key IDs`,
      programTitle: body.title,
      updatedCount,
      totalKeys: body.cdKeys.length
    });
  } catch (error) {
    console.error("[CD Key ID Updater] Error:", error);
    return NextResponse.json(
      {
        error: "CD Key ID update failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({
    message: "CD Key ID Updater Webhook",
    description: "Updates CD key IDs with proper validUntil dates when programs are saved",
    endpoint: "/api/cdkey-id-updater",
    method: "POST"
  });
}
