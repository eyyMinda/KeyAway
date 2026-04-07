import { client } from "@/src/sanity/lib/client";
import { resolveVisitTier } from "@/src/lib/visitors/visitTier";

export type VisitorContributionKind = "report" | "suggestion";

type VisitorContributionDoc = {
  _id: string;
  visitCount?: number;
  isSpammer?: boolean;
  reportCount?: number;
  suggestionCount?: number;
  contributionScore?: number;
};

/**
 * Increments contribution counters for a visitor and recomputes tier.
 * Used for successful key reports and key suggestions.
 */
export async function upsertVisitorContribution(
  visitorHash: string | undefined,
  kind: VisitorContributionKind
): Promise<void> {
  if (!visitorHash) return;

  const now = new Date().toISOString();
  const existing = await client.fetch<VisitorContributionDoc | null>(
    `*[_type == "visitor" && visitorHash == $h][0]{
      _id,
      visitCount,
      isSpammer,
      reportCount,
      suggestionCount,
      contributionScore
    }`,
    { h: visitorHash }
  );

  const prevVisitCount = existing?.visitCount ?? 0;
  const prevReportCount = existing?.reportCount ?? 0;
  const prevSuggestionCount = existing?.suggestionCount ?? 0;
  const prevContributionScore = existing?.contributionScore ?? 0;
  const isSpammer = existing?.isSpammer === true;

  const nextReportCount = kind === "report" ? prevReportCount + 1 : prevReportCount;
  const nextSuggestionCount = kind === "suggestion" ? prevSuggestionCount + 1 : prevSuggestionCount;
  const nextContributionScore = prevContributionScore + 1;
  const nextVisitTier = resolveVisitTier(prevVisitCount, nextContributionScore, isSpammer);

  if (!existing?._id) {
    await client.create({
      _type: "visitor",
      visitorHash,
      visitCount: 0,
      lastActivityAt: now,
      visitTier: nextVisitTier,
      isSpammer: false,
      reportCount: nextReportCount,
      suggestionCount: nextSuggestionCount,
      contributionScore: nextContributionScore,
      createdAt: now,
      updatedAt: now
    });
    return;
  }

  await client
    .patch(existing._id)
    .set({
      reportCount: nextReportCount,
      suggestionCount: nextSuggestionCount,
      contributionScore: nextContributionScore,
      visitTier: nextVisitTier,
      updatedAt: now
    })
    .commit();
}
