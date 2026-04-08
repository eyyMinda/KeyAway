import { contributionTypeFromCounts, type ContributionType, type VisitTier } from "@/src/lib/visitors/visitTier";
import type { VisitorHintData } from "@/src/lib/visitors/publicVisitorContext";

export function labelForTier(tier: VisitTier): string {
  switch (tier) {
    case "new":
      return "New visitor";
    case "returning":
      return "Welcome back";
    case "regular":
      return "Regular visitor";
    case "star":
      return "Top supporter";
    default:
      return "Visitor";
  }
}

export function lineForTier(tier: VisitTier, contributionType: ContributionType): string | null {
  switch (tier) {
    case "new":
      return "Browse freely and grab the pro keys you need. Report the keys as 'Working' to let others know.";
    case "returning":
      return "Quick reports after you try a key help everyone. Make sure to check other programs, they are often very useful.";
    case "regular":
      if (contributionType === "reports_only") {
        return "Your key reports help everyone — thank you.";
      }
      if (contributionType === "suggestions_only") {
        return "Your suggestions shaped the list — thank you.";
      }
      if (contributionType === "mixed") {
        return "Your reports and suggestions both helped — thank you.";
      }
      return "Thanks for sticking with the community.";
    case "star":
      if (contributionType === "reports_only") {
        return "Your key checks made a real difference — thank you.";
      }
      if (contributionType === "suggestions_only") {
        return "Your suggestions mattered — thank you.";
      }
      return "Thanks for both reports and suggestions.";
    default:
      return null;
  }
}

/** Builds the same `VisitorHintData` shape as `getVisitorContextForPublicPage` (pure, for tests). */
export function buildVisitorHintData(doc: {
  visitTier: VisitTier;
  visitCount: number;
  reportCount: number;
  suggestionCount: number;
}): VisitorHintData | null {
  const { visitTier: tier } = doc;
  const visitCount = Math.max(0, doc.visitCount ?? 0);
  const reportCount = Math.max(0, doc.reportCount ?? 0);
  const suggestionCount = Math.max(0, doc.suggestionCount ?? 0);
  const contributionType = contributionTypeFromCounts(reportCount, suggestionCount);
  const message = lineForTier(tier, contributionType);
  if (!message) return null;
  return {
    tier,
    label: labelForTier(tier),
    message,
    contributionType,
    visitCount,
    reportCount,
    suggestionCount
  };
}
