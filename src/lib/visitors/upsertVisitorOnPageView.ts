import { client } from "@/src/sanity/lib/client";
import { fetchVisitorByHash } from "@/src/lib/visitors/visitorLookup";
import { resolveVisitTier } from "@/src/lib/visitors/visitTier";

const SESSION_GAP_MS = 60 * 60 * 1000;

/** After a stored `page_viewed`, patch or create `visitor` (1h idle = new session, increments visitCount / tier). */
export async function upsertVisitorOnPageView(
  visitorHash: string | undefined,
  location?: { country?: string; city?: string }
): Promise<void> {
  if (!visitorHash) return;

  const now = new Date().toISOString();
  const nowMs = Date.now();

  const existing = await client.fetch<{
    _id: string;
    visitCount: number;
    lastActivityAt: string;
    contributionScore?: number;
    isSpammer?: boolean;
  } | null>(
    `*[_type == "visitor" && visitorHash == $h][0]{ _id, visitCount, lastActivityAt, contributionScore, isSpammer }`,
    { h: visitorHash }
  );

  if (!existing) {
    const archived = await fetchVisitorByHash(visitorHash);
    const prevCount = archived?.visitCount ?? 0;
    const contributionScore = archived?.contributionScore ?? 0;
    const isSpammer = archived?.isSpammer === true;
    const nextCount = prevCount + 1;
    await client.create({
      _type: "visitor",
      visitorHash,
      visitCount: nextCount,
      lastActivityAt: now,
      visitTier: resolveVisitTier(nextCount, contributionScore, isSpammer),
      isSpammer,
      reportCount: archived?.reportCount ?? 0,
      suggestionCount: archived?.suggestionCount ?? 0,
      contributionScore,
      ...(location?.country ? { country: location.country } : {}),
      ...(location?.city ? { city: location.city } : {}),
      ...(location?.country || location?.city ? { geoUpdatedAt: now } : {}),
      createdAt: now,
      updatedAt: now
    });
    return;
  }

  const lastMs = new Date(existing.lastActivityAt).getTime();
  const newSession = !Number.isFinite(lastMs) || nowMs - lastMs > SESSION_GAP_MS;
  const nextCount = newSession ? existing.visitCount + 1 : existing.visitCount;
  const contributionScore = existing.contributionScore ?? 0;
  const isSpammer = existing.isSpammer === true;

  await client
    .patch(existing._id)
    .set({
      visitCount: nextCount,
      lastActivityAt: now,
      visitTier: resolveVisitTier(nextCount, contributionScore, isSpammer),
      ...(location?.country ? { country: location.country } : {}),
      ...(location?.city ? { city: location.city } : {}),
      ...(location?.country || location?.city ? { geoUpdatedAt: now } : {}),
      updatedAt: now
    })
    .commit();
}
