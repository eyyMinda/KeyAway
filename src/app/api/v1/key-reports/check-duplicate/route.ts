import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { duplicateKeyReportQuery } from "@/src/lib/sanity/queries";
import { getKeyData } from "@/src/lib/keyHashing";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { isLikelyBotUserAgent } from "@/src/lib/api/botUserAgent";
import { getClientIp, hashIp } from "@/src/lib/api/requestGeo";

/** POST /api/v1/key-reports/check-duplicate - Check for existing report by same visitor/program/key */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const ua = req.headers.get("user-agent") || undefined;
  if (isLikelyBotUserAgent(ua)) {
    return NextResponse.json({ data: { isDuplicate: false, skipped: true }, meta: {} });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") return Errors.badRequest("Request body is required");

    const b = body as Record<string, unknown>;
    const programSlug = typeof b.programSlug === "string" ? b.programSlug.trim() : "";
    const key = b.key;
    const programFlow = typeof b.programFlow === "string" ? b.programFlow : undefined;

    if (!programSlug) return Errors.validation("programSlug is required");
    if (!key) return Errors.validation("key is required");

    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    if (!ipHash) return Errors.validation("Unable to generate visitor hash");

    const kd = getKeyData(key, programFlow);
    if (!kd?.hash) return Errors.validation("key is invalid or empty for this program flow");
    const storageKey = kd.hash;

    const existingReport = await client.fetch<{
      _id: string;
      eventType: string;
      programSlug: string;
      key: string;
      label?: string;
      createdAt: string;
    } | null>(duplicateKeyReportQuery, { ipHash, programSlug, key: storageKey });

    if (existingReport) {
      return NextResponse.json({
        data: {
          isDuplicate: true,
          existingReport: {
            _id: existingReport._id,
            eventType: existingReport.eventType,
            programSlug: existingReport.programSlug,
            key: existingReport.key,
            label: existingReport.label,
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
