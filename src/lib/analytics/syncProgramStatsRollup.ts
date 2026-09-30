/** @fileoverview Cron: aggregate session view/download counts onto program docs. */
import { calculatePopularityScore } from "@/src/lib/program/programUtils";
import {
  TAG_FEATURED_PROGRAM,
  TAG_HOMEPAGE_PROGRAMS,
  TAG_PROGRAM_LISTINGS
} from "@/src/lib/cache/cacheTags";
import { mutationClient } from "@/src/lib/sanity/mutationClient";
import { revalidateTag } from "next/cache";

const BUNDLE_BATCH = 40;

type StatsRow = { page_viewed: number; download_click: number };

function applyEvent(
  map: Map<string, StatsRow>,
  programSlug: string | undefined,
  event: string | undefined,
  notFound?: boolean
) {
  const slug = programSlug?.trim();
  if (!slug || !event) return;
  const row = map.get(slug) ?? { page_viewed: 0, download_click: 0 };
  if (event === "page_viewed" && !notFound) row.page_viewed++;
  else if (event === "download_click") row.download_click++;
  map.set(slug, row);
}

async function aggregateEventStats(): Promise<Map<string, StatsRow>> {
  const map = new Map<string, StatsRow>();

  const liveSessions = await mutationClient.fetch<Array<{ events?: Array<{ programSlug?: string; event?: string; notFound?: boolean }> }>>(
    `*[_type == "trackingSession"]{
      "events": events[event in ["page_viewed", "download_click"]]{ programSlug, event, notFound }
    }`
  );
  for (const session of liveSessions ?? []) {
    for (const e of session.events ?? []) applyEvent(map, e.programSlug, e.event, e.notFound);
  }

  let sessionOffset = 0;
  while (true) {
    const batch = await mutationClient.fetch<
      Array<{ sessions?: Array<{ events?: Array<{ programSlug?: string; event?: string; notFound?: boolean }> }> }>
    >(
      `*[_type == "trackingSessionBundle"] | order(_id asc) [$start...$end]{
        "sessions": sessions[]{
          "events": events[event in ["page_viewed", "download_click"]]{ programSlug, event, notFound }
        }
      }`,
      { start: sessionOffset, end: sessionOffset + BUNDLE_BATCH - 1 }
    );
    if (!batch?.length) break;
    for (const bundle of batch) {
      for (const session of bundle.sessions ?? []) {
        for (const e of session.events ?? []) applyEvent(map, e.programSlug, e.event, e.notFound);
      }
    }
    if (batch.length < BUNDLE_BATCH) break;
    sessionOffset += BUNDLE_BATCH;
  }

  return map;
}

export interface SyncProgramStatsRollupResult {
  ok: boolean;
  patched: number;
  error?: string;
}

/** Writes merged view/download/popularity scores onto each program document. */
export async function runSyncProgramStatsRollup(): Promise<SyncProgramStatsRollupResult> {
  try {
    const statsBySlug = await aggregateEventStats();
    const programs = await mutationClient.fetch<Array<{ _id: string; slug?: { current?: string } }>>(
      `*[_type == "program"]{ _id, slug }`
    );

    let patched = 0;
    const tx = mutationClient.transaction();

    for (const program of programs ?? []) {
      const slug = program.slug?.current;
      const row = slug ? statsBySlug.get(slug) : undefined;
      const viewCount = row?.page_viewed ?? 0;
      const downloadCount = row?.download_click ?? 0;
      const popularityScore = calculatePopularityScore(viewCount, downloadCount);
      tx.patch(program._id, p =>
        p
          .set({ stats: { viewCount, downloadCount, popularityScore } })
          .unset(["viewCount", "downloadCount", "popularityScore"])
      );
      patched++;
    }

    if (patched > 0) {
      await tx.commit();
      revalidateTag(TAG_PROGRAM_LISTINGS, "max");
      revalidateTag(TAG_HOMEPAGE_PROGRAMS, "max");
      revalidateTag(TAG_FEATURED_PROGRAM, "max");
    }

    return { ok: true, patched };
  } catch (err) {
    console.error("[syncProgramStatsRollup]", err);
    return {
      ok: false,
      patched: 0,
      error: err instanceof Error ? err.message : "Rollup sync failed"
    };
  }
}
