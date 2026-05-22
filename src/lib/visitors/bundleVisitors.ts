/** @fileoverview Cron: moves inactive `visitor` docs into `visitorBundle`, deletes sources. */
import { randomUUID } from "node:crypto";
import {
  BUNDLE_MAX_ITERATIONS,
  BUNDLE_SIZE,
  BUNDLING_RETENTION_DAYS
} from "@/src/lib/analytics/bundlingConstants";
import { client } from "@/src/sanity/lib/client";

const VISITOR_FIELDS =
  "visitorHash, visitCount, lastActivityAt, visitTier, isSpammer, reportCount, suggestionCount, contributionScore, spamMarkedAt, country, city, geoUpdatedAt, createdAt, updatedAt";

function toBundledVisitor(doc: Record<string, unknown> & { _id?: string }) {
  return {
    _type: "bundledVisitor",
    _key: randomUUID(),
    visitorHash: doc.visitorHash,
    visitCount: doc.visitCount,
    lastActivityAt: doc.lastActivityAt,
    visitTier: doc.visitTier,
    isSpammer: doc.isSpammer,
    reportCount: doc.reportCount,
    suggestionCount: doc.suggestionCount,
    contributionScore: doc.contributionScore,
    spamMarkedAt: doc.spamMarkedAt,
    country: doc.country,
    city: doc.city,
    geoUpdatedAt: doc.geoUpdatedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

export interface BundleVisitorsResult {
  ok: boolean;
  created: number;
  appended: number;
  error?: string;
}

/** Bundles visitors with lastActivityAt older than retention (2 days). Set skipRetention=true for one-time migration. */
export async function runBundleVisitors(skipRetention = false): Promise<BundleVisitorsResult> {
  const cutoff = skipRetention
    ? new Date(Date.now() + 864e5).toISOString()
    : new Date(Date.now() - BUNDLING_RETENTION_DAYS * 864e5).toISOString();
  let created = 0;
  let appended = 0;

  try {
    while (true) {
      const incomplete = await client.fetch<{ _id: string; visitorCount: number; timeRangeEnd: string } | null>(
        `*[_type == "visitorBundle" && visitorCount < $limit] | order(timeRangeEnd desc) [0]{ _id, visitorCount, timeRangeEnd }`,
        { limit: BUNDLE_SIZE }
      );
      if (!incomplete) break;

      const limit = BUNDLE_SIZE - incomplete.visitorCount;
      const toAdd = await client.fetch<Array<Record<string, unknown> & { _id: string }>>(
        `*[_type == "visitor" && lastActivityAt < $cutoff && lastActivityAt > $after] | order(lastActivityAt asc) [0...$limit]{ _id, ${VISITOR_FIELDS} }`,
        { cutoff, after: incomplete.timeRangeEnd, limit }
      );
      if (!toAdd.length) break;

      const newVisitors = toAdd.map(d => toBundledVisitor(d));
      const lastVisitor = toAdd[toAdd.length - 1];
      const newTimeRangeEnd = (lastVisitor.lastActivityAt as string) ?? incomplete.timeRangeEnd;
      const newVisitorCount = incomplete.visitorCount + toAdd.length;
      const idsToDelete = toAdd.map(v => v._id);
      const tx = client.transaction();
      const now = new Date().toISOString();
      tx.patch(incomplete._id, p =>
        p
          .append("visitors", newVisitors)
          .set({ timeRangeEnd: newTimeRangeEnd, visitorCount: newVisitorCount, updatedAt: now })
      );
      idsToDelete.forEach(id => tx.delete(id));
      await tx.commit();
      appended += toAdd.length;
    }

    const latestBundle = await client.fetch<{ timeRangeEnd: string } | null>(
      `*[_type == "visitorBundle"] | order(timeRangeEnd desc) [0]{ timeRangeEnd }`
    );
    let after = latestBundle?.timeRangeEnd ?? "";
    for (let i = 0; i < BUNDLE_MAX_ITERATIONS; i++) {
      const batch = await client.fetch<Array<Record<string, unknown> & { _id: string }>>(
        after
          ? `*[_type == "visitor" && lastActivityAt < $cutoff && lastActivityAt > $after] | order(lastActivityAt asc) [0...$limit]{ _id, ${VISITOR_FIELDS} }`
          : `*[_type == "visitor" && lastActivityAt < $cutoff] | order(lastActivityAt asc) [0...$limit]{ _id, ${VISITOR_FIELDS} }`,
        after ? { cutoff, after, limit: BUNDLE_SIZE } : { cutoff, limit: BUNDLE_SIZE }
      );
      if (!batch.length) break;

      const visitors = batch.map(d => toBundledVisitor(d));
      const timeRangeStart = (visitors[0].lastActivityAt as string) ?? cutoff;
      const timeRangeEnd = (visitors[visitors.length - 1].lastActivityAt as string) ?? cutoff;
      after = timeRangeEnd;
      const idsToDelete = batch.map(v => v._id);
      const tx = client.transaction();
      const now = new Date().toISOString();
      tx.create({
        _type: "visitorBundle",
        bundledAt: now,
        updatedAt: now,
        timeRangeStart,
        timeRangeEnd,
        visitorCount: visitors.length,
        visitors
      });
      idsToDelete.forEach(id => tx.delete(id));
      await tx.commit();
      created += 1;
    }

    return { ok: true, created, appended };
  } catch (err) {
    console.error("Bundle-visitors error:", err);
    return {
      ok: false,
      created,
      appended,
      error: err instanceof Error ? err.message : "Bundling failed"
    };
  }
}
