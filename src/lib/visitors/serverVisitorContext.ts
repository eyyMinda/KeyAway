/** @fileoverview RSC: load `visitor` by hashed IP for spammer gate and optional welcome line from visit tier. */
import { client } from "@/src/sanity/lib/client";
import { getClientIpFromForwardedHeaders, hashIp } from "@/src/lib/api/requestGeo";
import { contributionTypeFromCounts, type ContributionType, type VisitTier } from "@/src/lib/visitors/visitTier";
import type { PublicVisitorContext, VisitorHintData } from "@/src/lib/visitors/publicVisitorContext";

function labelForTier(tier: VisitTier): string {
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

function lineForTier(tier: VisitTier, contributionType: ContributionType): string | null {
  switch (tier) {
    case "new":
      return "First time here? Start with programs showing the strongest active-key ratio.";
    case "returning":
      return "Welcome back - check recently updated programs first.";
    case "regular":
      if (contributionType === "reports_only") return "Thanks for helping verify key status.";
      if (contributionType === "suggestions_only" || contributionType === "mixed") {
        return "Thanks for sharing key suggestions and feedback.";
      }
      return "You visit often - check the latest key updates.";
    case "star":
      if (contributionType === "reports_only") return "Top contributor in key verification.";
      if (contributionType === "suggestions_only") return "Top contributor in key suggestions.";
      return "Top contributor across suggestions and verification.";
    default:
      return null;
  }
}

function makeHintData(doc: {
  visitTier?: VisitTier;
  visitCount?: number;
  reportCount?: number;
  suggestionCount?: number;
}): VisitorHintData | null {
  const tier = doc.visitTier;
  if (!tier) return null;
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

export async function getVisitorContextForPublicPage(headersList: Headers): Promise<PublicVisitorContext> {
  const ip = getClientIpFromForwardedHeaders(headersList);
  const visitorHash = hashIp(ip);
  if (!visitorHash) {
    return { isSpammer: false, visitorWelcomeLine: null, visitorHint: null };
  }

  const doc = await client.fetch<{
    isSpammer?: boolean;
    visitTier?: VisitTier;
    visitCount?: number;
    reportCount?: number;
    suggestionCount?: number;
  } | null>(
    `*[_type == "visitor" && visitorHash == $h][0]{ isSpammer, visitTier, visitCount, reportCount, suggestionCount }`,
    { h: visitorHash }
  );

  if (doc?.isSpammer === true) {
    return {
      isSpammer: true,
      visitorWelcomeLine: "Some actions are temporarily limited for quality control.",
      visitorHint: null
    };
  }

  const visitorHint = doc ? makeHintData(doc) : null;
  return {
    isSpammer: false,
    visitorWelcomeLine: visitorHint?.message ?? null,
    visitorHint
  };
}
