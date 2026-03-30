/** @fileoverview Public POST tracking: creates `trackingEvent` or `keyReport`, geo + visitor upsert on page views, spammer skip on reports. */
import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { TrackRequestBody } from "@/src/types";
import { getKeyData } from "@/src/lib/keyHashing";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { getClientIp, hashIp, getLocationFromIP } from "@/src/lib/api/requestGeo";
import { upsertVisitorOnPageView } from "@/src/lib/visitors/upsertVisitorOnPageView";
import { isVisitorSpammerByHash } from "@/src/lib/visitors/isVisitorSpammerByHash";
import { isProgramSlugPublished } from "@/src/lib/sanity/programSlugExists";

const ANALYTICS_EVENTS = new Set([
  "copy_cdkey",
  "download_click",
  "social_click",
  "page_viewed"
]);
const REPORT_EVENTS = new Set(["report_key_working", "report_key_expired", "report_key_limit_reached"]);

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
    const ip = getClientIp(req);
    const location = await getLocationFromIP(ip, "KeyAway Analytics");

    let programSlug = body.meta?.programSlug as string | undefined;
    const keyData = getKeyData(body.meta?.key);
    const social = body.meta?.social as string | undefined;
    const path = body.meta?.path as string | undefined;
    const referrer = body.meta?.referrer as string | undefined;
    const utmSource = body.meta?.utm_source as string | undefined;
    const utmMedium = body.meta?.utm_medium as string | undefined;
    const utmCampaign = body.meta?.utm_campaign as string | undefined;

    const isReportEvent = REPORT_EVENTS.has(body.event);
    const slugWasProvided = Boolean(programSlug?.trim());

    if (!isReportEvent && programSlug) {
      const ok = await isProgramSlugPublished(programSlug);
      if (!ok) programSlug = undefined;
    }

    const ipHash = hashIp(ip);
    if (
      isReportEvent &&
      (await isVisitorSpammerByHash(ipHash)) &&
      body.event !== "report_key_working"
    ) {
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

    if (body.event === "page_viewed") {
      try {
        await upsertVisitorOnPageView(ipHash);
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
