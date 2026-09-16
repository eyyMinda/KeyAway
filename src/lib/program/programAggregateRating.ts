/** @fileoverview Community aggregateRating derived from all key reports (every row, every status) for a program. */
import { client } from "@/src/sanity/lib/client";
import { programKeyReportCountsQuery } from "@/src/lib/sanity/queries";

/** Below this, ratings are too thin to publish as rich-result signals. */
export const MIN_REPORTS_FOR_RATING = 3;

const JSON_LD_BEST_RATING = 5;
const JSON_LD_WORST_RATING = 1;

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

  const working = Math.max(0, Math.trunc(counts?.working ?? 0));
  const expired = Math.max(0, Math.trunc(counts?.expired ?? 0));
  const limitReached = Math.max(0, Math.trunc(counts?.limitReached ?? 0));
  const ratingCount = working + expired + limitReached;
  if (ratingCount < MIN_REPORTS_FOR_RATING) return null;

  const share = working / ratingCount;
  return {
    ratingValue: Math.round(share * 5 * 10) / 10,
    ratingCount,
    successPercent: Math.round(share * 100)
  };
}

/** Google Rich Results: integer `ratingCount`, integer `ratingValue` within [1, 5]. */
export function sanitizeAggregateRatingForJsonLd(
  rating: Pick<ProgramRating, "ratingValue" | "ratingCount"> | null | undefined
): { ratingValue: number; ratingCount: number; bestRating: number; worstRating: number } | null {
  if (!rating) return null;

  const ratingCount = Math.trunc(Number(rating.ratingCount));
  if (!Number.isFinite(ratingCount) || ratingCount < MIN_REPORTS_FOR_RATING) return null;

  const raw = Number(rating.ratingValue);
  const ratingValue = Number.isFinite(raw)
    ? Math.max(JSON_LD_WORST_RATING, Math.min(JSON_LD_BEST_RATING, Math.round(raw)))
    : JSON_LD_WORST_RATING;

  return {
    ratingValue,
    ratingCount,
    bestRating: JSON_LD_BEST_RATING,
    worstRating: JSON_LD_WORST_RATING
  };
}
