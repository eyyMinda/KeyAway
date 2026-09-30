/** @fileoverview Public POST tracking: appends a visit session, or creates `keyReport` plus a session row. */
import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { TrackRequestBody } from "@/src/types";
import { getKeyData } from "@/src/lib/keyHashing";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { normalizePath } from "@/src/lib/api/inputNormalize";
import { isRecentDuplicateRequest } from "@/src/lib/api/shortRequestDedupe";
import { isAutomatedAnalyticsRequest } from "@/src/lib/api/isAutomatedAnalyticsRequest";
import { getClientIp, hashIp, locationFromVercelHeaders } from "@/src/lib/api/requestGeo";
import { appendTrackingSession } from "@/src/lib/analytics/appendTrackingSession";
import { isSessionEntry } from "@/src/lib/analytics/sessionConstants";
import { upsertVisitorOnPageView } from "@/src/lib/visitors/upsertVisitorOnPageView";
import { upsertVisitorContribution } from "@/src/lib/visitors/upsertVisitorContribution";
import { fetchVisitorByHash } from "@/src/lib/visitors/visitorLookup";
import { isProgramSlugPublishedCached } from "@/src/lib/sanity/getCachedPublishedProgramSlugs";
import { getAdminSession } from "@/src/lib/admin/adminAuth";
import { parseVersionFitInput } from "@/src/lib/program/keyReportVersionFit";

const ANALYTICS_EVENTS = new Set([
  "copy_cdkey",
  "copy_pro_account",
  "click_activation_link",
  "download_click",
  "affiliate_click",
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
    event === "affiliate_click" ||
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

    if (await getAdminSession()) {
      return NextResponse.json({ data: { accepted: true, skipped: true, reason: "admin" }, meta: {} });
    }

    const ua = req.headers.get("user-agent") || undefined;
    if (isAutomatedAnalyticsRequest(req, body.event)) {
      return NextResponse.json({ data: { accepted: true, skipped: true, reason: "automated" }, meta: {} });
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
      const pathNorm = normalizePath(typeof body.meta?.path === "string" ? body.meta.path : "");
      const slugFromPath = pathNorm.startsWith("/program/") ? pathNorm.split("/")[2] : undefined;
      const trustedProgramPath = Boolean(slugFromPath && slugFromPath === programSlug.trim());
      if (!trustedProgramPath) {
        const ok = await isProgramSlugPublishedCached(programSlug);
        if (!ok) programSlug = undefined;
      }
    }

    const ipHash = ipHashEarly;
    const resolvedVisitor = ipHash ? await fetchVisitorByHash(ipHash) : null;
    const visitor =
      resolvedVisitor?.source === "live" && resolvedVisitor._id
        ? {
            _id: resolvedVisitor._id,
            isSpammer: resolvedVisitor.isSpammer,
            country: resolvedVisitor.country,
            city: resolvedVisitor.city
          }
        : resolvedVisitor
          ? { isSpammer: resolvedVisitor.isSpammer, country: resolvedVisitor.country, city: resolvedVisitor.city }
          : null;

    const location = locationFromVercelHeaders(req.headers) ??
      (visitor?.country || visitor?.city ? { country: visitor.country, city: visitor.city } : undefined);

    if (isReportEvent && visitor?.isSpammer === true && body.event !== "report_key_working") {
      return NextResponse.json({ data: { accepted: true, skipped: true }, meta: {} });
    }

    const eventData: Record<string, unknown> = {
      _type: "keyReport",
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

    if (isReportEvent) {
      const version = parseVersionFitInput(body.event, {
        triedVersionFit: body.meta?.triedVersionFit,
        listedVersion: body.meta?.listedVersion,
        triedVersion: body.meta?.triedVersion
      });
      if (!version.ok) return Errors.validation(version.error);
      Object.assign(eventData, version.fields);
    }

    const sessionId = typeof body.meta?.sessionId === "string" ? body.meta.sessionId : undefined;
    const sessionEntry = typeof body.meta?.sessionEntry === "string" ? body.meta.sessionEntry : undefined;

    if (isReportEvent) {
      await client.create(eventData as { _type: string } & Record<string, unknown>);
    }

    try {
      await appendTrackingSession({
        sessionId,
        visitorHash: ipHash,
        userAgent: ua,
        country: location?.country,
        city: location?.city,
        entry: isSessionEntry(sessionEntry) ? sessionEntry : undefined,
        referrer,
        landingPath: path,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        events: [
          {
            event: body.event,
            path,
            programSlug,
            notFound: eventData.notFound === true,
            key: typeof eventData.key === "string" ? eventData.key : undefined,
            label: typeof eventData.label === "string" ? eventData.label : undefined,
            social,
            activationUrl,
            programFlow: typeof eventData.programFlow === "string" ? eventData.programFlow : undefined,
            listedVersion: typeof eventData.listedVersion === "string" ? eventData.listedVersion : undefined,
            triedVersionFit: typeof eventData.triedVersionFit === "string" ? eventData.triedVersionFit : undefined,
            triedVersion: typeof eventData.triedVersion === "string" ? eventData.triedVersion : undefined
          }
        ]
      });
    } catch (e) {
      console.error("[track] session append", e);
      if (!isReportEvent) throw e;
    }

    if (isReportEvent && ipHash) {
      try {
        await upsertVisitorContribution(ipHash, "report");
      } catch (e) {
        console.error("[track] visitor contribution upsert (report)", e);
      }
    }

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
