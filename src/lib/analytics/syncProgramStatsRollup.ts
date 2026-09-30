/** @fileoverview Cron: aggregate session view/download counts onto program docs. */
import { calculatePopularityScore } from "@/src/lib/program/programUtils";
import {
  TAG_FEATURED_PROGRAM,
  TAG_HOMEPAGE_PROGRAMS,
  TAG_PROGRAM_LISTINGS
} from "@/src/lib/cache/cacheTags";
import { mutationClient } from "@/src/lib/sanity/mutationClient";
import { revalidateTag } from "next/cache";

const BUNDLE_CHUNK = 8;

type StatsRow = { page_viewed: number; download_click: number };

function safeSlug(slug: string): string | null {
  return /^[a-z0-9-]+$/i.test(slug) ? slug : null;
}

/** Counts stay inside GROQ. Bundle counts are per document so the cron does not scan every bundle on every slug. */
function countFields(slugs: string[], scope: "live" | "bundle"): string {
  return slugs
    .flatMap(slug => {
      const views =
        scope === "live"
          ? `count(*[_type == "trackingSession"].events[programSlug == "${slug}" && event == "page_viewed" && notFound != true])`
          : `count(sessions[].events[programSlug == "${slug}" && event == "page_viewed" && notFound != true])`;
      const downloads =
        scope === "live"
          ? `count(*[_type == "trackingSession"].events[programSlug == "${slug}" && event == "download_click"])`
          : `count(sessions[].events[programSlug == "${slug}" && event == "download_click"])`;
      return [`"${slug}__v": ${views}`, `"${slug}__d": ${downloads}`];
    })
    .join(", ");
}

function addCounts(map: Map<string, StatsRow>, slugs: string[], raw: Record<string, number> | null) {
  for (const slug of slugs) {
    const row = map.get(slug) ?? { page_viewed: 0, download_click: 0 };
    row.page_viewed += raw?.[`${slug}__v`] ?? 0;
    row.download_click += raw?.[`${slug}__d`] ?? 0;
    map.set(slug, row);
  }
}

async function aggregateEventStats(slugs: string[]): Promise<Map<string, StatsRow>> {
  const map = new Map<string, StatsRow>();
  const usable = slugs.map(safeSlug).filter((slug): slug is string => Boolean(slug));
  if (!usable.length) return map;

  const live = await mutationClient.fetch<Record<string, number>>(`{ ${countFields(usable, "live")} }`);
  addCounts(map, usable, live);

  const bundleIds = await mutationClient.fetch<string[]>(`*[_type == "trackingSessionBundle"]._id`);
  for (let i = 0; i < (bundleIds?.length ?? 0); i += BUNDLE_CHUNK) {
    const ids = bundleIds.slice(i, i + BUNDLE_CHUNK);
    const rows = await mutationClient.fetch<Array<Record<string, number>>>(
      `*[_id in $ids]{ ${countFields(usable, "bundle")} }`,
      { ids }
    );
    for (const row of rows ?? []) addCounts(map, usable, row);
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
    const programs = await mutationClient.fetch<Array<{ _id: string; slug?: { current?: string } }>>(
      `*[_type == "program"]{ _id, slug }`
    );
    const statsBySlug = await aggregateEventStats(
      (programs ?? []).map(program => program.slug?.current ?? "").filter(Boolean)
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
