export type VisitTier = "new" | "returning" | "regular" | "star";
export type ContributionType = "none" | "reports_only" | "suggestions_only" | "mixed";

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
export function contributionTypeFromCounts(reportCount: number, suggestionCount: number): ContributionType {
  const hasReports = reportCount > 0;
  const hasSuggestions = suggestionCount > 0;
  if (hasReports && hasSuggestions) return "mixed";
  if (hasReports) return "reports_only";
  if (hasSuggestions) return "suggestions_only";
  return "none";
}
