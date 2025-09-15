import { NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import crypto from "crypto";

function hashIp(ip: string | undefined) {
  try {
    const salt = process.env.ANALYTICS_SALT || "";
    return crypto
      .createHash("sha256")
      .update((ip || "") + salt)
      .digest("hex");
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reportId, newEventType, programSlug, key } = body;

    if (!reportId || !newEventType || !programSlug || !key) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // Validate event type
    const validEventTypes = ["report_key_working", "report_key_expired", "report_key_limit_reached"];
    if (!validEventTypes.includes(newEventType)) {
      return NextResponse.json({ ok: false, error: "Invalid event type" }, { status: 400 });
    }

    // Get IP and hash it
    const xff = req.headers.get("x-forwarded-for") || "";
    const ip = xff.split(",")[0]?.trim() || undefined;
    const ipHash = hashIp(ip);

    if (!ipHash) {
      return NextResponse.json({ ok: false, error: "Unable to generate visitor hash" }, { status: 400 });
    }

    // Verify the report exists and belongs to this visitor
    const existingReport = await client.fetch(`*[_type=="keyReport" && _id == $reportId && ipHash == $ipHash][0]`, {
      reportId,
      ipHash
    });

    if (!existingReport) {
      return NextResponse.json({ ok: false, error: "Report not found or access denied" }, { status: 404 });
    }

    // Update the report with new event type and timestamp
    const updatedReport = await client
      .patch(reportId)
      .set({
        eventType: newEventType,
        createdAt: new Date().toISOString()
      })
      .commit();

    return NextResponse.json({
      ok: true,
      updatedReport: {
        _id: updatedReport._id,
        eventType: updatedReport.eventType,
        programSlug: updatedReport.programSlug,
        keyHash: updatedReport.keyHash,
        keyIdentifier: updatedReport.keyIdentifier,
        createdAt: updatedReport.createdAt
      }
    });
  } catch (err) {
    console.error("Renew key report error:", err);
    return NextResponse.json({ ok: false, error: "Failed to renew key report" }, { status: 500 });
  }
}
