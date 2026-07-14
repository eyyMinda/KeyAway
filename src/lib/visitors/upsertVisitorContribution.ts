import { client } from "@/src/sanity/lib/client";
import { fetchVisitorByHash } from "@/src/lib/visitors/visitorLookup";
import { resolveVisitTier } from "@/src/lib/visitors/visitTier";

export type VisitorContributionKind = "report" | "suggestion" | "comment";

type VisitorContributionDoc = {
  _id: string;
  visitCount?: number;
  isSpammer?: boolean;
  reportCount?: number;
  suggestionCount?: number;
  commentCount?: number;
  contributionScore?: number;
};

/**
 * Increments contribution counters for a visitor and recomputes tier.
 * Used for successful key reports, key suggestions, and program comments.
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
      commentCount,
      contributionScore
    }`,
    { h: visitorHash }
  );

  const prevVisitCount = existing?.visitCount ?? 0;
  const prevReportCount = existing?.reportCount ?? 0;
  const prevSuggestionCount = existing?.suggestionCount ?? 0;
  const prevCommentCount = existing?.commentCount ?? 0;
  const prevContributionScore = existing?.contributionScore ?? 0;
  const isSpammer = existing?.isSpammer === true;

  const nextReportCount = kind === "report" ? prevReportCount + 1 : prevReportCount;
  const nextSuggestionCount = kind === "suggestion" ? prevSuggestionCount + 1 : prevSuggestionCount;
  const nextCommentCount = kind === "comment" ? prevCommentCount + 1 : prevCommentCount;
  const nextContributionScore = prevContributionScore + 1;
  const nextVisitTier = resolveVisitTier(prevVisitCount, nextContributionScore, isSpammer);

  if (!existing?._id) {
    const archived = await fetchVisitorByHash(visitorHash);
    const visitCount = archived?.visitCount ?? 0;
    const restoredReport = archived?.reportCount ?? 0;
    const restoredSuggestion = archived?.suggestionCount ?? 0;
    const restoredComment = archived?.commentCount ?? 0;
    const restoredScore = archived?.contributionScore ?? 0;
    const isSpammer = archived?.isSpammer === true;
    const reportCount = kind === "report" ? restoredReport + 1 : restoredReport;
    const suggestionCount = kind === "suggestion" ? restoredSuggestion + 1 : restoredSuggestion;
    const commentCount = kind === "comment" ? restoredComment + 1 : restoredComment;
    const contributionScore = restoredScore + 1;
    await client.create({
      _type: "visitor",
      visitorHash,
      visitCount,
      lastActivityAt: archived?.lastActivityAt ?? now,
      visitTier: resolveVisitTier(visitCount, contributionScore, isSpammer),
      isSpammer,
      reportCount,
      suggestionCount,
      commentCount,
      contributionScore,
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
      commentCount: nextCommentCount,
      contributionScore: nextContributionScore,
      visitTier: nextVisitTier,
      lastActivityAt: now,
      updatedAt: now
    })
    .commit();
}

/** Ensures a visitor doc exists and bumps lastActivityAt (no contribution increment). */
export async function touchVisitorActivity(visitorHash: string | undefined): Promise<void> {
  if (!visitorHash) return;

  const now = new Date().toISOString();
  const existing = await client.fetch<VisitorContributionDoc | null>(
    `*[_type == "visitor" && visitorHash == $h][0]{
      _id,
      visitCount,
      isSpammer,
      reportCount,
      suggestionCount,
      commentCount,
      contributionScore
    }`,
    { h: visitorHash }
  );

  if (existing?._id) {
    await client.patch(existing._id).set({ lastActivityAt: now, updatedAt: now }).commit();
    return;
  }

  const archived = await fetchVisitorByHash(visitorHash);
  const visitCount = archived?.visitCount ?? 0;
  const contributionScore = archived?.contributionScore ?? 0;
  const isSpammer = archived?.isSpammer === true;

  await client.create({
    _type: "visitor",
    visitorHash,
    visitCount,
    lastActivityAt: now,
    visitTier: resolveVisitTier(visitCount, contributionScore, isSpammer),
    isSpammer,
    reportCount: archived?.reportCount ?? 0,
    suggestionCount: archived?.suggestionCount ?? 0,
    commentCount: archived?.commentCount ?? 0,
    contributionScore,
    ...(archived?.country ? { country: archived.country } : {}),
    ...(archived?.city ? { city: archived.city } : {}),
    createdAt: now,
    updatedAt: now
  });
}
