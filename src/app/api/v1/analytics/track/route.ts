/** @fileoverview Public POST tracking: creates `trackingEvent` or `keyReport`, geo + visitor upsert on page views, spammer skip on reports. */
import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { TrackRequestBody } from "@/src/types";
import { getKeyData } from "@/src/lib/keyHashing";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { normalizePath } from "@/src/lib/api/inputNormalize";
import { isRecentDuplicateRequest } from "@/src/lib/api/shortRequestDedupe";
import { isLikelyBotUserAgent } from "@/src/lib/api/botUserAgent";
import { getClientIp, hashIp, getLocationFromIP } from "@/src/lib/api/requestGeo";
import { upsertVisitorOnPageView } from "@/src/lib/visitors/upsertVisitorOnPageView";
import { isProgramSlugPublished } from "@/src/lib/sanity/programSlugExists";

const ANALYTICS_EVENTS = new Set([
  "copy_cdkey",
  "copy_pro_account",
  "click_activation_link",
  "download_click",
  "social_click",
  "page_viewed"
]);
const REPORT_EVENTS = new Set(["report_key_working", "report_key_expired", "report_key_limit_reached"]);

function activationUrlFromMeta(meta: TrackRequestBody["meta"]): string | undefined {
  const u = meta?.activationUrl;
  if (typeof u !== "string" || !u.trim()) return undefined;
  return u.trim().toLowerCase();
}

function buildAnalyticsEventDedupeKey(event: string, body: TrackRequestBody, ipHash: string): string {
  const pathNorm = normalizePath(typeof body.meta?.path === "string" ? body.meta.path : "/");
  const slugPart =
    typeof body.meta?.programSlug === "string" && body.meta.programSlug.trim()
      ? body.meta.programSlug.trim()
      : "-";
  const activationUrl = activationUrlFromMeta(body.meta);

  if (
    event === "copy_cdkey" ||
    event === "copy_pro_account" ||
    event === "click_activation_link" ||
    event === "download_click" ||
    event === "social_click"
  ) {
    const socialPart =
      typeof body.meta?.social === "string" && body.meta.social.trim() ? body.meta.social.trim() : "-";
    let keyPart = "-";
    if (
      (event === "copy_cdkey" || event === "copy_pro_account" || event === "click_activation_link") &&
      body.meta?.key
    ) {
      const kd = getKeyData(
        body.meta.key,
        body.meta.programFlow,
        event === "click_activation_link" ? activationUrl : undefined
      );
      if (kd?.hash) {
        keyPart = kd.hash;
        if (event === "click_activation_link") {
          keyPart += `|${activationUrl ?? "-"}`;
        }
      }
    }
    return `analytics|${event}|${ipHash}|${pathNorm}|${slugPart}|${socialPart}|${keyPart}`;
  }

  if (event === "page_viewed") {
    const nf = body.meta?.notFound === true ? "1" : "0";
    return `analytics|page_viewed|${ipHash}|${pathNorm}|${slugPart}|${nf}`;
  }

  let keyPart = "-";
  if (body.meta?.key) {
    const kd = getKeyData(body.meta.key, body.meta.programFlow, activationUrl);
    if (kd?.hash) keyPart = kd.hash;
  }
  return `analytics|${event}|${ipHash}|${pathNorm}|${slugPart}|${keyPart}`;
}

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
    if (isLikelyBotUserAgent(ua)) {
      return NextResponse.json({ data: { accepted: true, skipped: true }, meta: {} });
    }

    const ip = getClientIp(req);
    const ipHashEarly = hashIp(ip) ?? "unknown";

    if (isRecentDuplicateRequest(buildAnalyticsEventDedupeKey(body.event, body, ipHashEarly))) {
      return NextResponse.json({ data: { accepted: true, deduped: true }, meta: {} });
    }
    const ref = req.headers.get("referer") || undefined;

    let programSlug = body.meta?.programSlug as string | undefined;
    const activationUrl = activationUrlFromMeta(body.meta);
    const keyData = body.meta?.key
      ? getKeyData(
          body.meta.key,
          body.meta.programFlow,
          body.event === "click_activation_link" ? activationUrl : undefined
        )
      : undefined;
    const social = body.meta?.social as string | undefined;
    const path = body.meta?.path as string | undefined;
    const referrer = body.meta?.referrer as string | undefined;
    const utmSource = body.meta?.utm_source as string | undefined;
    const utmMedium = body.meta?.utm_medium as string | undefined;
    const utmCampaign = body.meta?.utm_campaign as string | undefined;

    const isReportEvent = REPORT_EVENTS.has(body.event);
    const slugWasProvided = Boolean(programSlug?.trim());

    if (body.event === "page_viewed" && programSlug) {
      const ok = await isProgramSlugPublished(programSlug);
      if (!ok) programSlug = undefined;
    }

    const ipHash = ipHashEarly;
    const visitor = ipHash
      ? await client.fetch<{ _id?: string; isSpammer?: boolean; country?: string; city?: string } | null>(
          `*[_type == "visitor" && visitorHash == $h][0]{ _id, isSpammer, country, city }`,
          { h: ipHash }
        )
      : null;

    let location: { country?: string; city?: string } | undefined =
      visitor?.country || visitor?.city ? { country: visitor.country, city: visitor.city } : undefined;

    if (!location) {
      location = await getLocationFromIP(ip, "KeyAway Analytics");
      if (visitor?._id && (location?.country || location?.city)) {
        await client
          .patch(visitor._id)
          .set({
            ...(location.country ? { country: location.country } : {}),
            ...(location.city ? { city: location.city } : {}),
            geoUpdatedAt: new Date().toISOString()
          })
          .commit();
      }
    }

    if (isReportEvent && visitor?.isSpammer === true && body.event !== "report_key_working") {
      return NextResponse.json({ data: { accepted: true, skipped: true }, meta: {} });
    }

    const documentType = isReportEvent ? "keyReport" : "trackingEvent";

    const eventData: Record<string, unknown> = {
      _type: documentType,
      referrer: ref,
      userAgent: ua,
      ipHash,
      createdAt: new Date().toISOString()
    };
    if (isReportEvent) (eventData as Record<string, string>).eventType = body.event;
    else (eventData as Record<string, string>).event = body.event;
    if (body.event === "page_viewed") {
      let notFound = body.meta?.notFound === true;
      if (slugWasProvided && !programSlug) notFound = true;
      if (notFound) programSlug = undefined;
      eventData.notFound = notFound;
    }
    if (programSlug) eventData.programSlug = programSlug;
    if (typeof body.meta?.programFlow === "string" && body.meta.programFlow.trim()) {
      eventData.programFlow = body.meta.programFlow.trim();
    }
    if (keyData) {
      if (isReportEvent) {
        eventData.key = keyData.hash;
        eventData.label = keyData.identifier;
      } else if (body.event === "copy_cdkey" || body.event === "copy_pro_account") {
        eventData.key = keyData.normalized;
      } else if (body.event === "click_activation_link") {
        eventData.key = keyData.hash;
      } else {
        eventData.key = keyData.hash;
      }
    }
    if (!isReportEvent && body.event === "click_activation_link" && activationUrl) {
      eventData.activationUrl = activationUrl;
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

    if (body.event === "page_viewed") {
      try {
        await upsertVisitorOnPageView(ipHash, location);
      } catch (e) {
        console.error("[track] visitor upsert", e);
      }
    }

    return NextResponse.json({ data: { accepted: true }, meta: {} });
  } catch (err) {
    console.error("[POST /api/v1/analytics/track]", err);
    return Errors.internal();
  }
}
