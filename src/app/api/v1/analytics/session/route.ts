/** @fileoverview Batched visit writes: one `trackingSession` document, landing referrer only. */
import { NextRequest, NextResponse } from "next/server";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { isAutomatedAnalyticsRequest } from "@/src/lib/api/isAutomatedAnalyticsRequest";
import { isRecentDuplicateRequest } from "@/src/lib/api/shortRequestDedupe";
import { getClientIp, hashIp, getLocationFromIP } from "@/src/lib/api/requestGeo";
import { getAdminSession } from "@/src/lib/admin/adminAuth";
import { appendTrackingSession, type SessionEventInput } from "@/src/lib/analytics/appendTrackingSession";
import { isSessionEntry } from "@/src/lib/analytics/sessionConstants";
import { upsertVisitorOnPageView } from "@/src/lib/visitors/upsertVisitorOnPageView";
import { fetchVisitorByHash } from "@/src/lib/visitors/visitorLookup";
import { getKeyData } from "@/src/lib/keyHashing";
import { normalizePath } from "@/src/lib/api/inputNormalize";
import { isProgramSlugPublishedCached } from "@/src/lib/sanity/getCachedPublishedProgramSlugs";

const ANALYTICS_EVENTS = new Set([
  "copy_cdkey",
  "copy_pro_account",
  "click_activation_link",
  "download_click",
  "affiliate_click",
  "social_click",
  "page_viewed"
]);

type IncomingEvent = {
  event?: string;
  createdAt?: string;
  meta?: Record<string, unknown>;
};

function activationUrlFromMeta(meta: Record<string, unknown> | undefined): string | undefined {
  const u = meta?.activationUrl;
  if (typeof u !== "string" || !u.trim()) return undefined;
  return u.trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  try {
    const host = req.headers.get("host") || "";
    if (host.startsWith("localhost") || host.includes("127.0.0.1")) {
      return NextResponse.json({ data: { accepted: true, skipped: true }, meta: {} });
    }
    if (await getAdminSession()) {
      return NextResponse.json({ data: { accepted: true, skipped: true, reason: "admin" }, meta: {} });
    }

    const body = (await req.json()) as {
      sessionId?: string;
      entry?: string;
      referrer?: string;
      landingPath?: string;
      events?: IncomingEvent[];
    };

    const incoming = Array.isArray(body.events) ? body.events.slice(0, 30) : [];
    const hasPageView = incoming.some(e => e.event === "page_viewed");
    if (isAutomatedAnalyticsRequest(req, hasPageView ? "page_viewed" : "download_click")) {
      return NextResponse.json({ data: { accepted: true, skipped: true, reason: "automated" }, meta: {} });
    }

    const ip = getClientIp(req);
    const ipHash = hashIp(ip) ?? "unknown";
    const ua = req.headers.get("user-agent") || undefined;

    const resolvedVisitor = ipHash ? await fetchVisitorByHash(ipHash) : null;
    let location: { country?: string; city?: string } | undefined =
      resolvedVisitor?.country || resolvedVisitor?.city
        ? { country: resolvedVisitor.country, city: resolvedVisitor.city }
        : undefined;
    if (!location) location = await getLocationFromIP(ip, "KeyAway Analytics");

    const events: SessionEventInput[] = [];
    let sawPageView = false;

    for (const item of incoming) {
      if (!item.event || !ANALYTICS_EVENTS.has(item.event)) continue;
      const meta = item.meta ?? {};
      const path = typeof meta.path === "string" ? normalizePath(meta.path) : undefined;
      let programSlug = typeof meta.programSlug === "string" ? meta.programSlug.trim() : undefined;
      const activationUrl = activationUrlFromMeta(meta);
      const dedupeKey = `session|${item.event}|${ipHash}|${path ?? "/"}|${programSlug ?? "-"}|${activationUrl ?? "-"}`;
      if (isRecentDuplicateRequest(dedupeKey)) continue;

      if (item.event === "page_viewed" && programSlug) {
        const slugFromPath = path?.startsWith("/program/") ? path.split("/")[2] : undefined;
        const trusted = Boolean(slugFromPath && slugFromPath === programSlug);
        if (!trusted) {
          const ok = await isProgramSlugPublishedCached(programSlug);
          if (!ok) programSlug = undefined;
        }
      }

      let notFound = meta.notFound === true;
      if (item.event === "page_viewed" && typeof meta.programSlug === "string" && meta.programSlug.trim() && !programSlug) {
        notFound = true;
      }

      const keyData = meta.key
        ? getKeyData(meta.key, typeof meta.programFlow === "string" ? meta.programFlow : undefined, activationUrl)
        : undefined;

      events.push({
        event: item.event,
        createdAt: item.createdAt,
        path,
        programSlug: notFound ? undefined : programSlug,
        notFound: item.event === "page_viewed" ? notFound : undefined,
        key: keyData?.hash,
        label: keyData?.identifier,
        social: typeof meta.social === "string" ? meta.social : undefined,
        activationUrl,
        programFlow: typeof meta.programFlow === "string" ? meta.programFlow : undefined
      });
      if (item.event === "page_viewed") sawPageView = true;
    }

    if (!events.length) {
      return NextResponse.json({ data: { accepted: true, skipped: true }, meta: {} });
    }

    const result = await appendTrackingSession({
      sessionId: body.sessionId,
      visitorHash: ipHash,
      userAgent: ua,
      country: location?.country,
      city: location?.city,
      entry: isSessionEntry(body.entry) ? body.entry : undefined,
      referrer: body.referrer,
      landingPath: body.landingPath,
      events
    });

    if (sawPageView) {
      try {
        await upsertVisitorOnPageView(ipHash, location);
      } catch (e) {
        console.error("[session] visitor upsert", e);
      }
    }

    return NextResponse.json({ data: { accepted: true, ...result }, meta: {} });
  } catch (err) {
    console.error("[POST /api/v1/analytics/session]", err);
    return Errors.internal();
  }
}
