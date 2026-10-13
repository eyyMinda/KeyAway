import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { normalizeUrl } from "@/src/lib/giveaways/matchProgram";
import { findSourceForUrl, loadDiscoveryConfig } from "@/src/lib/giveaways/settings";
import { loadWatchState } from "@/src/lib/giveaways/watchState";
import { mutationClient } from "@/src/lib/sanity/mutationClient";
import type { GiveawayFind, GiveawaySourceOption, GiveawayWatchPageHealth } from "@/src/types/giveaways";

const programRef = `{_id, title, "slug": slug.current, programFlow}`;

const giveawayFindsQuery = `{
  "finds": *[_type == "giveawayFind"] | order(coalesce(lastChangedAt, firstSeenAt) desc) [0...500]{
    _id, sourceId, sourceUrl, sourceTitle, publishedAt, matchMethod, matchConfidence, detectedFlow,
    keys[]{_key, value, isNew, ignoredReason}, accounts[]{_key, username, password, isNew, ignoredReason}, links[]{_key, url, label, isNew, ignoredReason},
    version, validUntil, excerpt, status, dismissedReason, firstSeenAt, lastSeenAt, lastChangedAt, notes,
    "program": program->${programRef},
    "candidates": candidates[]{_key, score, "program": program->${programRef}}
  },
  "programs": *[_type == "program" && !(_id in path("drafts.**"))] | order(title asc){_id, title},
  "lastRun": *[_type == "cronRun" && job == "discover-giveaways"] | order(ranAt desc)[0]{status, source, details, ranAt}
}`;

export type GiveawayFindsPayload = {
  finds: GiveawayFind[];
  /** Source keys/labels from the private settings (admin only, never bundled into the page). */
  sources: GiveawaySourceOption[];
  programs: { _id: string; title: string }[];
  /** Every watch page with its last check result (admin only). */
  watchPages: GiveawayWatchPageHealth[];
  lastRun: { status: string; source: string; details?: string; ranAt: string } | null;
};

/** GET /api/v1/admin/giveaway-finds - Giveaway finds, source labels, program list for reassignment, and the last scan run */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    // Dataset API, not the CDN: the page re-reads right after a PATCH.
    const [data, config, watchState] = await Promise.all([
      mutationClient.fetch<Omit<GiveawayFindsPayload, "sources" | "watchPages">>(giveawayFindsQuery),
      loadDiscoveryConfig(),
      loadWatchState()
    ]);
    const programs = data?.programs ?? [];
    const watched = new Set(config.watchPages.map(w => normalizeUrl(w.url)));
    const watchPages: GiveawayWatchPageHealth[] = config.watchPages.map(w => {
      const state = watchState.get(normalizeUrl(w.url));
      return {
        key: w._key ?? "",
        url: w.url,
        programId: w.programId,
        programTitle: programs.find(p => p._id === w.programId)?.title,
        sourceLabel: findSourceForUrl(config.sources, w.url)?.label,
        checkedAt: state?.checkedAt,
        lastOkAt: state?.lastOkAt,
        lastError: state?.lastError,
        errorCount: state?.errorCount ?? 0
      };
    });
    return NextResponse.json({
      data: {
        finds: (data?.finds ?? []).map(f => ({ ...f, watched: watched.has(normalizeUrl(f.sourceUrl)) })),
        sources: config.sourceLabels,
        programs,
        watchPages,
        lastRun: data?.lastRun ?? null
      },
      meta: {}
    });
  } catch (err) {
    console.error("[GET /api/v1/admin/giveaway-finds]", err);
    return Errors.internal();
  }
}
