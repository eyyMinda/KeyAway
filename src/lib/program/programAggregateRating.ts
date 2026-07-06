/** @fileoverview Community aggregateRating derived from all key reports (every row, every status) for a program. */
import { client } from "@/src/sanity/lib/client";
import { programKeyReportCountsQuery } from "@/src/lib/sanity/queries";

/** Below this, ratings are too thin to publish as rich-result signals. */
const MIN_REPORTS_FOR_RATING = 3;

export interface ProgramRating {
  /** 1–5 scale (working share × 5), one decimal. */
  ratingValue: number;
  /** Total reports across all rows and statuses. */
  ratingCount: number;
  /** Working share as a whole percentage, for UI copy. */
  successPercent: number;
}

/** Returns null when the program has fewer than `MIN_REPORTS_FOR_RATING` reports. */
export async function getProgramAggregateRating(slug: string): Promise<ProgramRating | null> {
  const counts = await client.fetch<{ working?: number; expired?: number; limitReached?: number }>(
    programKeyReportCountsQuery,
    { slug }
  );

  const working = counts?.working ?? 0;
  const ratingCount = working + (counts?.expired ?? 0) + (counts?.limitReached ?? 0);
  if (ratingCount < MIN_REPORTS_FOR_RATING) return null;

  const share = working / ratingCount;
  return {
    ratingValue: Math.round(share * 5 * 10) / 10,
    ratingCount,
    successPercent: Math.round(share * 100)
  };
}
