import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import crypto from "crypto";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

const VALID_EVENT_TYPES = ["report_key_working", "report_key_expired", "report_key_limit_reached"];

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

/** POST /api/v1/key-reports/renew - Change event type of existing report (same visitor) */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  try {
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") return Errors.badRequest("Request body is required");

    const b = body as Record<string, unknown>;
    const reportId = typeof b.reportId === "string" ? b.reportId.trim() : "";
    const newEventType = typeof b.newEventType === "string" ? b.newEventType.trim() : "";
    const programSlug = typeof b.programSlug === "string" ? b.programSlug.trim() : "";
    const key = b.key;

    if (!reportId) return Errors.validation("reportId is required");
    if (!newEventType) return Errors.validation("newEventType is required");
    if (!programSlug) return Errors.validation("programSlug is required");
    if (!key) return Errors.validation("key is required");

    if (!VALID_EVENT_TYPES.includes(newEventType)) {
      return Errors.validation(`Invalid event type. Must be one of: ${VALID_EVENT_TYPES.join(", ")}`);
    }

    const xff = req.headers.get("x-forwarded-for") || "";
    const ip = xff.split(",")[0]?.trim() || undefined;
    const ipHash = hashIp(ip);
    if (!ipHash) return Errors.validation("Unable to generate visitor hash");

    const existingReport = await client.fetch<{
      _id: string;
      eventType: string;
      programSlug: string;
      keyHash: string;
      keyIdentifier: string;
      createdAt: string;
    } | null>(`*[_type=="keyReport" && _id == $reportId && ipHash == $ipHash][0]`, {
      reportId,
      ipHash
    });

    if (!existingReport) return Errors.notFound("Report not found or access denied");

    const updatedReport = await client
      .patch(reportId)
      .set({ eventType: newEventType, createdAt: new Date().toISOString() })
      .commit();

    return NextResponse.json({
      data: {
        updatedReport: {
          _id: (updatedReport as Record<string, unknown>)._id,
          eventType: (updatedReport as Record<string, unknown>).eventType,
          programSlug: (updatedReport as Record<string, unknown>).programSlug,
          keyHash: (updatedReport as Record<string, unknown>).keyHash,
          keyIdentifier: (updatedReport as Record<string, unknown>).keyIdentifier,
          createdAt: (updatedReport as Record<string, unknown>).createdAt
        }
      },
      meta: {}
    });
  } catch (err) {
    console.error("[POST /api/v1/key-reports/renew]", err);
    return Errors.internal();
  }
}
