export type VisitTier = "new" | "returning" | "regular" | "star";

/** Maps session count to tier: ≤1 new, ≤5 returning, ≤15 regular, else star. */
export function visitTierFromSessionCount(n: number): VisitTier {
  if (n <= 1) return "new";
  if (n <= 5) return "returning";
  if (n <= 15) return "regular";
  return "star";
}
