import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import crypto from "crypto";
import { hashCDKey, getKeyIdentifier, normalizeKey } from "@/src/lib/keyHashing";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import type { KeyReportEvent } from "@/src/types";

const REPORT_EVENTS = new Set<KeyReportEvent>(["report_key_working", "report_key_expired", "report_key_limit_reached"]);

function getKeyData(key?: unknown): { hash: string; identifier: string; normalized: string } | undefined {
  let keyString: string | undefined;
  if (typeof key === "string" && key) keyString = key;
  else if (key && typeof key === "object" && "key" in key) keyString = (key as { key: string }).key;
  if (!keyString) return undefined;
  return {
    hash: hashCDKey(keyString),
    identifier: getKeyIdentifier(keyString),
    normalized: normalizeKey(keyString)
  };
}

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

const locationCache = new Map<string, { data: { country?: string; city?: string }; expires: number }>();
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, entry] of locationCache.entries()) {
      if (entry.expires <= now) locationCache.delete(ip);
    }
  },
  10 * 60 * 1000
);

async function getLocationFromIP(ip: string | undefined): Promise<{ country?: string; city?: string } | undefined> {
  if (!ip) return undefined;
  const cached = locationCache.get(ip);
  if (cached && cached.expires > Date.now()) return cached.data;
  const services = [
    {
      url: `https://ipapi.co/${ip}/json/`,
      parser: (data: Record<string, unknown>) => ({ country: data.country_name as string, city: data.city as string })
    },
    {
      url: `https://ip-api.com/json/${ip}`,
      parser: (data: Record<string, unknown>) => ({ country: data.country as string, city: data.city as string })
    },
    {
      url: `https://ipinfo.io/${ip}/json`,
      parser: (data: Record<string, unknown>) => ({ country: data.country as string, city: data.city as string })
    }
  ];
  for (const service of services) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(service.url, {
        headers: { "User-Agent": "KeyAway" },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        const result = service.parser(data);
        if (result.country || result.city) {
          locationCache.set(ip, { data: result, expires: Date.now() + 60 * 60 * 1000 });
          return result;
        }
      }
    } catch {
      continue;
    }
  }
  return undefined;
}

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
    const host = req.headers.get("host") || "";
    const isLocalhost = host.startsWith("localhost") || host.includes("127.0.0.1");

    const xff = req.headers.get("x-forwarded-for") || "";
    const ip = xff.split(",")[0]?.trim() || undefined;
    const ipHash = hashIp(ip);
    if (!ipHash) return Errors.validation("Unable to generate visitor hash");

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
      if (isLocalhost) {
        return NextResponse.json({
          data: { updatedReport: { _id: reportId, eventType: newEventType }, skipped: true },
          meta: {}
        });
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

    if (isLocalhost) {
      return NextResponse.json({ data: { created: true, skipped: true }, meta: {} });
    }

    const programSlug = meta?.programSlug as string | undefined;
    const keyData = getKeyData(meta?.key);
    if (!programSlug || !keyData) {
      return Errors.validation("programSlug and key (or meta.key) required");
    }

    const ua = req.headers.get("user-agent") || undefined;
    const ref = req.headers.get("referer") || undefined;
    const path = meta?.path as string | undefined;
    const location = await getLocationFromIP(ip);

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
