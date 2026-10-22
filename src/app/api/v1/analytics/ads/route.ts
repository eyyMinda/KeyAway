/** POST /api/v1/analytics/ads — batched ad counts (loads/fills/views/clicks) from `adTracker`, added onto counters. */
import { NextRequest, NextResponse } from "next/server";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { normalizePath } from "@/src/lib/api/inputNormalize";
import { isAutomatedAnalyticsRequest } from "@/src/lib/api/isAutomatedAnalyticsRequest";
import { getAdminSession } from "@/src/lib/admin/adminAuth";
import { isKnownAdPlacement, type AdUnitKind } from "@/src/lib/ads/adPlacements";
import { recordAdStats, type AdStatInput } from "@/src/lib/analytics/adStatsStore";

const MAX_ITEMS = 60;
/** Per item per batch; a real page can't produce more, so larger numbers are tampering. */
const MAX_COUNT = 20;
const UNITS = new Set<AdUnitKind>(["banner", "native", "card", "rail", "link"]);

function count(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : 0;
  return Math.min(MAX_COUNT, Math.max(0, n));
}

function parseItems(body: unknown): AdStatInput[] {
  const raw = (body as { items?: unknown })?.items;
  if (!Array.isArray(raw)) return [];
  const items: AdStatInput[] = [];
  for (const entry of raw.slice(0, MAX_ITEMS)) {
    const e = entry as Record<string, unknown>;
    if (typeof e.path !== "string" || typeof e.placement !== "string" || typeof e.unit !== "string") continue;
    if (!isKnownAdPlacement(e.placement) || !UNITS.has(e.unit as AdUnitKind)) continue;
    const path = normalizePath(e.path.split("?")[0]).slice(0, 200);
    if (path.startsWith("/admin") || path.startsWith("/studio") || path.startsWith("/api")) continue;
    const item = {
      path,
      placement: e.placement,
      unit: e.unit,
      loads: count(e.loads),
      fills: count(e.fills),
      views: count(e.views),
      clicks: count(e.clicks)
    };
    if (item.loads + item.fills + item.views + item.clicks > 0) items.push(item);
  }
  return items;
}

export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const host = req.headers.get("host") || "";
  if (host.startsWith("localhost") || host.includes("127.0.0.1")) return new NextResponse(null, { status: 204 });
  if (isAutomatedAnalyticsRequest(req, "ad_stats")) return new NextResponse(null, { status: 204 });
  if (await getAdminSession()) return new NextResponse(null, { status: 204 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Errors.validation("Invalid JSON");
  }

  const items = parseItems(body);
  if (items.length === 0) return new NextResponse(null, { status: 204 });

  try {
    await recordAdStats(items);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[POST /api/v1/analytics/ads]", err);
    return Errors.internal();
  }
}
