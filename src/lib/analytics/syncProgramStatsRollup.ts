/** @fileoverview Cron: aggregate session view/download counts onto program docs. */
import { calculatePopularityScore } from "@/src/lib/program/programUtils";
import {
  TAG_FEATURED_PROGRAM,
  TAG_HOMEPAGE_PROGRAMS,
  TAG_PROGRAM_LISTINGS
} from "@/src/lib/cache/cacheTags";
import { db } from "@/src/lib/db/postgres";
import { mutationClient } from "@/src/lib/sanity/mutationClient";
import { revalidateTag } from "next/cache";

type ProgramStats = { viewCount?: number; downloadCount?: number; popularityScore?: number };

/** Views exclude not-found page views (invalid slugs). */
async function aggregateEventStats(slugs: string[]): Promise<Map<string, { views: number; downloads: number }>> {
  if (!slugs.length) return new Map();
  const sql = db();
  const rows = await sql<Array<{ programSlug: string; views: number; downloads: number }>>`
    select program_slug,
           count(*) filter (where event = 'page_viewed' and not not_found)::int as views,
           count(*) filter (where event = 'download_click')::int as downloads
    from analytics.events
    where program_slug in ${sql(slugs)} and event in ('page_viewed', 'download_click')
    group by program_slug
  `;
  return new Map(rows.map(r => [r.programSlug, { views: r.views, downloads: r.downloads }]));
}

export interface SyncProgramStatsRollupResult {
  ok: boolean;
  patched: number;
  error?: string;
}

/** Writes view/download/popularity scores onto program documents whose numbers changed. */
export async function runSyncProgramStatsRollup(): Promise<SyncProgramStatsRollupResult> {
  try {
    const programs = await mutationClient.fetch<
      Array<{ _id: string; slug?: string; stats?: ProgramStats; legacy: boolean }>
    >(`*[_type == "program"]{ _id, "slug": slug.current, stats, "legacy": defined(viewCount) || defined(downloadCount) || defined(popularityScore) }`);
    const statsBySlug = await aggregateEventStats(
      (programs ?? []).map(program => program.slug ?? "").filter(Boolean)
    );

    let patched = 0;
    const tx = mutationClient.transaction();

    for (const program of programs ?? []) {
      const row = program.slug ? statsBySlug.get(program.slug) : undefined;
      const viewCount = row?.views ?? 0;
      const downloadCount = row?.downloads ?? 0;
      const popularityScore = calculatePopularityScore(viewCount, downloadCount);
      const unchanged =
        !program.legacy &&
        program.stats?.viewCount === viewCount &&
        program.stats?.downloadCount === downloadCount &&
        program.stats?.popularityScore === popularityScore;
      if (unchanged) continue;
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
