import type { ContributionType, VisitTier } from "@/src/lib/visitors/visitTier";

export interface VisitorHintData {
  tier: VisitTier;
  label: string;
  message: string;
  contributionType: ContributionType;
  visitCount: number;
  reportCount: number;
  suggestionCount: number;
}

export interface PublicVisitorContext {
  isSpammer: boolean;
  visitorWelcomeLine: string | null;
  visitorHint: VisitorHintData | null;
}
