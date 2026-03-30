import { client } from "@/src/sanity/lib/client";
import { visitTierFromSessionCount } from "@/src/lib/visitors/visitTier";

const SESSION_GAP_MS = 60 * 60 * 1000;

/** After a stored `page_viewed`, patch or create `visitor` (1h idle = new session, increments visitCount / tier). */
export async function upsertVisitorOnPageView(visitorHash: string | undefined): Promise<void> {
  if (!visitorHash) return;

  const now = new Date().toISOString();
  const nowMs = Date.now();

  const existing = await client.fetch<{
    _id: string;
    visitCount: number;
    lastActivityAt: string;
  } | null>(
    `*[_type == "visitor" && visitorHash == $h][0]{ _id, visitCount, lastActivityAt }`,
    { h: visitorHash }
  );

  if (!existing) {
    await client.create({
      _type: "visitor",
      visitorHash,
      visitCount: 1,
      lastActivityAt: now,
      visitTier: visitTierFromSessionCount(1),
      isSpammer: false,
      createdAt: now,
      updatedAt: now
    });
    return;
  }

  const lastMs = new Date(existing.lastActivityAt).getTime();
  const newSession = !Number.isFinite(lastMs) || nowMs - lastMs > SESSION_GAP_MS;
  const nextCount = newSession ? existing.visitCount + 1 : existing.visitCount;

  await client
    .patch(existing._id)
    .set({
      visitCount: nextCount,
      lastActivityAt: now,
      visitTier: visitTierFromSessionCount(nextCount),
      updatedAt: now
    })
    .commit();
}
