import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { duplicateKeyReportQuery } from "@/src/lib/sanity/queries";
import { hashCDKey } from "@/src/lib/keyHashing";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { getClientIp, hashIp } from "@/src/lib/api/requestGeo";

/** POST /api/v1/key-reports/check-duplicate - Check for existing report by same visitor/program/key */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  try {
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") return Errors.badRequest("Request body is required");

    const b = body as Record<string, unknown>;
    const programSlug = typeof b.programSlug === "string" ? b.programSlug.trim() : "";
    const key = b.key;

    if (!programSlug) return Errors.validation("programSlug is required");
    if (!key) return Errors.validation("key is required");

    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    if (!ipHash) return Errors.validation("Unable to generate visitor hash");

    const keyHash = hashCDKey(typeof key === "string" ? key : ((key as { key: string })?.key ?? ""));

    const existingReport = await client.fetch<{
      _id: string;
      eventType: string;
      programSlug: string;
      keyHash: string;
      keyIdentifier: string;
      createdAt: string;
    } | null>(duplicateKeyReportQuery, { ipHash, programSlug, keyHash });

    if (existingReport) {
      return NextResponse.json({
        data: {
          isDuplicate: true,
          existingReport: {
            _id: existingReport._id,
            eventType: existingReport.eventType,
            programSlug: existingReport.programSlug,
            keyHash: existingReport.keyHash,
            keyIdentifier: existingReport.keyIdentifier,
            createdAt: existingReport.createdAt
          }
        },
        meta: {}
      });
    }

    return NextResponse.json({ data: { isDuplicate: false }, meta: {} });
  } catch (err) {
    console.error("[POST /api/v1/key-reports/check-duplicate]", err);
    return Errors.internal();
  }
}
