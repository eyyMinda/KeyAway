import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { getKeyData } from "@/src/lib/keyHashing";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { getClientIp, hashIp, getLocationFromIP } from "@/src/lib/api/requestGeo";
import { isVisitorSpammerByHash } from "@/src/lib/visitors/isVisitorSpammerByHash";
import type { KeyReportEvent } from "@/src/types";

const REPORT_EVENTS = new Set<KeyReportEvent>(["report_key_working", "report_key_expired", "report_key_limit_reached"]);

/** POST /api/v1/key-reports - Create or renew a key report.
 *  New: { event, meta: { programSlug, key, path? } }
 *  Renew: { reportId, newEventType, programSlug, key } */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  try {
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") return Errors.badRequest("Request body required");

    const b = body as Record<string, unknown>;

    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    if (!ipHash) return Errors.validation("Unable to generate visitor hash");

    const spammerNegativeForbidden = () =>
      Errors.forbidden("Spam-flagged visitors may only report keys as working.");

    // --- Renew: update existing report (same visitor) ---
    const reportId = typeof b.reportId === "string" ? b.reportId.trim() : "";
    const newEventType = typeof b.newEventType === "string" ? b.newEventType.trim() : "";
    const renewProgramSlug = typeof b.programSlug === "string" ? b.programSlug.trim() : "";
    const renewKey = b.key;

    if (reportId && newEventType && renewProgramSlug && renewKey) {
      if (!REPORT_EVENTS.has(newEventType as KeyReportEvent)) {
        return Errors.validation(
          "Invalid newEventType. Use report_key_working, report_key_expired, or report_key_limit_reached"
        );
      }
      if ((await isVisitorSpammerByHash(ipHash)) && newEventType !== "report_key_working") {
        return spammerNegativeForbidden();
      }
      const existingReport = await client.fetch<{ _id: string } | null>(
        `*[_type=="keyReport" && _id == $reportId && ipHash == $ipHash][0]{ _id }`,
        { reportId, ipHash }
      );
      if (!existingReport) return Errors.notFound("Report not found or access denied");
      const updated = await client
        .patch(reportId)
        .set({ eventType: newEventType, createdAt: new Date().toISOString() })
        .commit();
      const u = updated as Record<string, unknown>;
      return NextResponse.json({ data: { updatedReport: { _id: u._id, eventType: u.eventType } }, meta: {} });
    }

    // --- Create: new report ---
    const event = b.event as KeyReportEvent | undefined;
    const meta = b.meta as Record<string, unknown> | undefined;

    if (!event || !REPORT_EVENTS.has(event)) {
      return Errors.validation(
        "Invalid event. Use report_key_working, report_key_expired, or report_key_limit_reached"
      );
    }

    if ((await isVisitorSpammerByHash(ipHash)) && event !== "report_key_working") {
      return spammerNegativeForbidden();
    }

    const programSlug = meta?.programSlug as string | undefined;
    const keyData = getKeyData(meta?.key);
    if (!programSlug || !keyData) {
      return Errors.validation("programSlug and key (or meta.key) required");
    }

    const ua = req.headers.get("user-agent") || undefined;
    const ref = req.headers.get("referer") || undefined;
    const path = meta?.path as string | undefined;
    const location = await getLocationFromIP(ip, "KeyAway");

    const eventData: Record<string, unknown> = {
      _type: "keyReport",
      eventType: event,
      programSlug,
      keyHash: keyData.hash,
      keyIdentifier: keyData.identifier,
      keyNormalized: keyData.normalized,
      userAgent: ua,
      referrer: ref,
      ipHash,
      createdAt: new Date().toISOString()
    };
    if (path) eventData.path = path;
    if (location?.country) eventData.country = location.country;
    if (location?.city) eventData.city = location.city;

    if (!process.env.SANITY_API_TOKEN) {
      console.error("[POST /api/v1/key-reports] SANITY_API_TOKEN not set - writes will fail");
    }

    const created = await client.create(eventData as { _type: string } & Record<string, unknown>);

    return NextResponse.json({ data: { created: true, reportId: created._id }, meta: {} });
  } catch (err) {
    console.error("[POST /api/v1/key-reports]", err);
    return Errors.internal();
  }
}
