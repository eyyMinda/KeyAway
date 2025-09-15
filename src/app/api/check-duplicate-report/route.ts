import { NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { duplicateKeyReportQuery } from "@/src/lib/queries";
import { hashCDKey } from "@/src/lib/keyHashing";
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
    const { programSlug, key } = body;

    if (!programSlug || !key) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // Get IP and hash it
    const xff = req.headers.get("x-forwarded-for") || "";
    const ip = xff.split(",")[0]?.trim() || undefined;
    const ipHash = hashIp(ip);

    if (!ipHash) {
      return NextResponse.json({ ok: false, error: "Unable to generate visitor hash" }, { status: 400 });
    }

    // Hash the key
    const keyHash = hashCDKey(key);

    // Check for existing report
    const existingReport = await client.fetch(duplicateKeyReportQuery, {
      ipHash,
      programSlug,
      keyHash
    });

    if (existingReport) {
      return NextResponse.json({
        ok: true,
        isDuplicate: true,
        existingReport: {
          _id: existingReport._id,
          eventType: existingReport.eventType,
          programSlug: existingReport.programSlug,
          keyHash: existingReport.keyHash,
          keyIdentifier: existingReport.keyIdentifier,
          createdAt: existingReport.createdAt
        }
      });
    }

    return NextResponse.json({
      ok: true,
      isDuplicate: false
    });
  } catch (err) {
    console.error("Check duplicate report error:", err);
    return NextResponse.json({ ok: false, error: "Failed to check for duplicate report" }, { status: 500 });
  }
}
