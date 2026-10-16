import { NextRequest, NextResponse } from "next/server";
import { getKeyData } from "@/src/lib/keyHashing";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { isLikelyBotUserAgent } from "@/src/lib/api/botUserAgent";
import { getClientIp, hashIp, locationFromVercelHeaders } from "@/src/lib/api/requestGeo";
import { isVisitorSpammerByHash, upsertVisitorContribution } from "@/src/lib/visitors/visitorStore";
import { createKeyReport, listProgramKeyReportRows, renewOwnReport } from "@/src/lib/analytics/keyReportStore";
import { revalidateTag } from "next/cache";
import { TAG_HOMEPAGE_STATS } from "@/src/lib/cache/cacheTags";
import type { KeyReportEvent } from "@/src/types";
import { getAdminSession } from "@/src/lib/admin/adminAuth";
import { parseVersionFitInput } from "@/src/lib/program/keyReportVersionFit";
import { appendTrackingSession } from "@/src/lib/analytics/appendTrackingSession";

const REPORT_EVENTS = new Set<KeyReportEvent>(["report_key_working", "report_key_expired", "report_key_limit_reached"]);

/** Program page bars refresh after a visitor's own report by adding `fresh=<ts>`, which skips the CDN copy. */
const PROGRAM_ROWS_CACHE = "public, s-maxage=60, stale-while-revalidate=300";

/** GET /api/v1/key-reports?programSlug= - Report rows for a program's progress bars (no PII). */
export async function GET(req: NextRequest) {
  const programSlug = req.nextUrl.searchParams.get("programSlug")?.trim() ?? "";
  if (!/^[a-z0-9-]{1,120}$/i.test(programSlug)) return Errors.validation("programSlug is required");

  try {
    const rows = await listProgramKeyReportRows(programSlug);
    return NextResponse.json({ data: rows, meta: {} }, { headers: { "Cache-Control": PROGRAM_ROWS_CACHE } });
  } catch (err) {
    console.error("[GET /api/v1/key-reports]", err);
    return Errors.internal();
  }
}

/** POST /api/v1/key-reports - Create or renew a key report.
 *  New: { event, meta: { programSlug, key, path? } }
 *  Renew: { reportId, newEventType, programSlug, key } (reportId from check-duplicate) */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const ua = req.headers.get("user-agent") || undefined;
  if (isLikelyBotUserAgent(ua)) {
    return NextResponse.json({ data: { skipped: true }, meta: {} });
  }

  try {
    if (await getAdminSession()) {
      return NextResponse.json({ data: { skipped: true, reason: "admin" }, meta: {} });
    }

    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") return Errors.badRequest("Request body required");

    const b = body as Record<string, unknown>;

    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    if (!ipHash) return Errors.validation("Unable to generate visitor hash");

    const spammerNegativeForbidden = () =>
      Errors.forbidden("Spam-flagged visitors may only report keys as working.");

    // --- Renew: update this visitor's existing report ---
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
      const version = parseVersionFitInput(newEventType, b);
      if (!version.ok) return Errors.validation(version.error);

      const updated = await renewOwnReport(reportId, ipHash, newEventType as KeyReportEvent, version.fields);
      if (!updated) return Errors.notFound("Report not found or access denied");
      const renewSessionId = typeof b.sessionId === "string" ? b.sessionId : undefined;
      try {
        await appendTrackingSession({
          sessionId: renewSessionId,
          visitorHash: ipHash,
          userAgent: ua,
          entry: typeof b.sessionEntry === "string" ? b.sessionEntry : undefined,
          referrer: typeof b.referrer === "string" ? b.referrer : undefined,
          events: [
            {
              event: newEventType,
              programSlug: renewProgramSlug,
              path: typeof b.path === "string" ? b.path : undefined,
              ...version.fields
            }
          ]
        });
      } catch (e) {
        console.error("[POST /api/v1/key-reports] session append (renew)", e);
      }
      try {
        await upsertVisitorContribution(ipHash, "report");
      } catch (e) {
        console.error("[POST /api/v1/key-reports] visitor contribution upsert failed (renew)", e);
      }
      revalidateTag(TAG_HOMEPAGE_STATS, "max");
      return NextResponse.json({ data: { updatedReport: updated }, meta: {} });
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
    const keyData = getKeyData(meta?.key, meta?.programFlow as string | undefined);
    if (!programSlug || !keyData) {
      return Errors.validation("programSlug and key (or meta.key) required");
    }

    const ref = req.headers.get("referer") || undefined;
    const path = meta?.path as string | undefined;
    const location = locationFromVercelHeaders(req.headers);

    const version = parseVersionFitInput(event, { ...b, ...(meta ?? {}) });
    if (!version.ok) return Errors.validation(version.error);

    const created = await createKeyReport({
      eventType: event,
      programSlug,
      key: keyData.hash,
      label: keyData.identifier,
      userAgent: ua,
      referrer: ref,
      ipHash,
      path,
      country: location?.country,
      city: location?.city,
      ...version.fields
    });
    revalidateTag(TAG_HOMEPAGE_STATS, "max");
    const sessionId = typeof meta?.sessionId === "string" ? meta.sessionId : undefined;
    try {
      await appendTrackingSession({
        sessionId,
        visitorHash: ipHash,
        userAgent: ua,
        country: location?.country,
        city: location?.city,
        entry: typeof meta?.sessionEntry === "string" ? meta.sessionEntry : undefined,
        referrer: typeof meta?.referrer === "string" ? meta.referrer : undefined,
        landingPath: path,
        events: [
          {
            event,
            path,
            programSlug,
            key: keyData.hash,
            label: keyData.identifier,
            ...version.fields
          }
        ]
      });
    } catch (e) {
      console.error("[POST /api/v1/key-reports] session append", e);
    }
    try {
      await upsertVisitorContribution(ipHash, "report");
    } catch (e) {
      console.error("[POST /api/v1/key-reports] visitor contribution upsert failed (create)", e);
    }

    return NextResponse.json({ data: { created: true, reportId: created.id }, meta: {} });
  } catch (err) {
    console.error("[POST /api/v1/key-reports]", err);
    return Errors.internal();
  }
}
