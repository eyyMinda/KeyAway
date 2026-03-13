import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import crypto from "crypto";
import { TrackRequestBody } from "@/src/types";
import { hashCDKey, getKeyIdentifier, normalizeKey } from "@/src/lib/keyHashing";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

const ANALYTICS_EVENTS = new Set(["copy_cdkey", "download_click", "social_click", "page_viewed"]);
const REPORT_EVENTS = new Set(["report_key_working", "report_key_expired", "report_key_limit_reached"]);

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
        headers: { "User-Agent": "KeyAway Analytics" },
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

/** POST /api/v1/analytics/track - Track analytics or key report event */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  try {
    const body = (await req.json()) as TrackRequestBody;
    if (!body?.event || (!ANALYTICS_EVENTS.has(body.event) && !REPORT_EVENTS.has(body.event))) {
      return Errors.validation("Invalid event");
    }

    const host = req.headers.get("host") || "";
    if (host.startsWith("localhost") || host.includes("127.0.0.1")) {
      return NextResponse.json({ data: { accepted: true, skipped: true }, meta: {} });
    }

    const ua = req.headers.get("user-agent") || undefined;
    const ref = req.headers.get("referer") || undefined;
    const xff = req.headers.get("x-forwarded-for") || "";
    const ip = xff.split(",")[0]?.trim() || undefined;
    const location = await getLocationFromIP(ip);

    const programSlug = body.meta?.programSlug as string | undefined;
    const keyData = getKeyData(body.meta?.key);
    const social = body.meta?.social as string | undefined;
    const path = body.meta?.path as string | undefined;
    const referrer = body.meta?.referrer as string | undefined;
    const utmSource = body.meta?.utm_source as string | undefined;
    const utmMedium = body.meta?.utm_medium as string | undefined;
    const utmCampaign = body.meta?.utm_campaign as string | undefined;

    const isReportEvent = REPORT_EVENTS.has(body.event);
    const documentType = isReportEvent ? "keyReport" : "trackingEvent";

    const eventData: Record<string, unknown> = {
      _type: documentType,
      referrer: ref,
      userAgent: ua,
      ipHash: hashIp(ip),
      createdAt: new Date().toISOString()
    };
    if (isReportEvent) (eventData as Record<string, string>).eventType = body.event;
    else (eventData as Record<string, string>).event = body.event;
    if (programSlug) eventData.programSlug = programSlug;
    if (keyData) {
      eventData.keyHash = keyData.hash;
      eventData.keyIdentifier = keyData.identifier;
      eventData.keyNormalized = keyData.normalized;
    }
    if (social) eventData.social = social;
    if (path) eventData.path = path;
    if (referrer) eventData.referrer = referrer;
    if (utmSource) eventData.utm_source = utmSource;
    if (utmMedium) eventData.utm_medium = utmMedium;
    if (utmCampaign) eventData.utm_campaign = utmCampaign;
    if (location?.country) eventData.country = location.country;
    if (location?.city) eventData.city = location.city;

    await client.create(eventData as { _type: string } & Record<string, unknown>);

    return NextResponse.json({ data: { accepted: true }, meta: {} });
  } catch (err) {
    console.error("[POST /api/v1/analytics/track]", err);
    return Errors.internal();
  }
}
