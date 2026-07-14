export type VisitTier = "new" | "returning" | "regular" | "star";
export type ContributionType = "none" | "reports_only" | "suggestions_only" | "comments_only" | "mixed";

/** Maps session count to baseline tier: ≤1 new, ≤5 returning, else regular. */
export function visitTierFromSessionCount(n: number): VisitTier {
  if (n <= 1) return "new";
  if (n <= 5) return "returning";
  return "regular";
}

/** Contributor-star requires both high session count and contribution score. */
export function resolveVisitTier(visitCount: number, contributionScore: number, isSpammer: boolean): VisitTier {
  if (!isSpammer && visitCount >= 16 && contributionScore >= 5) return "star";
  return visitTierFromSessionCount(visitCount);
}

/** Derives contribution type for accurate, evidence-based messaging. */
export function contributionTypeFromCounts(
  reportCount: number,
  suggestionCount: number,
  commentCount = 0
): ContributionType {
  const kinds = [
    reportCount > 0,
    suggestionCount > 0,
    commentCount > 0
  ].filter(Boolean).length;
  if (kinds === 0) return "none";
  if (kinds > 1) return "mixed";
  if (reportCount > 0) return "reports_only";
  if (suggestionCount > 0) return "suggestions_only";
  return "comments_only";
}
