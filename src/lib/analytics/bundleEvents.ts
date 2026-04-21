/** @fileoverview Cron/migration: moves old `trackingEvent` docs into `trackingEventBundle`, deletes sources, optional retention window. */
import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import { client } from "@/src/sanity/lib/client";

const RETENTION_DAYS = 7;
const BUNDLE_SIZE = 1000;
const MAX_ITERATIONS = 10;

const EVENT_FIELDS =
  "event, programSlug, notFound, path, referrer, country, city, social, keyHash, keyIdentifier, keyNormalized, userAgent, ipHash, utm_source, utm_medium, utm_campaign, createdAt";

/** Each array row needs a unique `_key`; deriving only from `_id` can collide after truncation or duplicate appends. */
function toBundleEvent(doc: Record<string, unknown> & { _id?: string }) {
  return {
    _type: "bundledTrackingEvent",
    _key: randomUUID(),
    event: doc.event,
    programSlug: doc.programSlug,
    notFound: doc.notFound,
    path: doc.path,
    referrer: doc.referrer,
    country: doc.country,
    city: doc.city,
    social: doc.social,
    keyHash: doc.keyHash,
    keyIdentifier: doc.keyIdentifier,
    keyNormalized: doc.keyNormalized,
    userAgent: doc.userAgent,
    ipHash: doc.ipHash,
    utm_source: doc.utm_source,
    utm_medium: doc.utm_medium,
    utm_campaign: doc.utm_campaign,
    createdAt: doc.createdAt
  };
}

export interface BundleEventsResult {
  ok: boolean;
  created: number;
  appended: number;
  error?: string;
}

/** Runs the event bundling process. Uses retention cutoff (7 days) by default. Set skipRetention=true for one-time migration. */
export async function runBundleEvents(skipRetention = false): Promise<BundleEventsResult> {
  const cutoff = skipRetention
    ? new Date(Date.now() + 864e5).toISOString() // future = bundle all
    : new Date(Date.now() - RETENTION_DAYS * 864e5).toISOString();
  let created = 0;
  let appended = 0;

  try {
    while (true) {
      const incomplete = await client.fetch<{ _id: string; eventCount: number; timeRangeEnd: string } | null>(
        `*[_type == "trackingEventBundle" && eventCount < $limit] | order(timeRangeEnd desc) [0]{ _id, eventCount, timeRangeEnd }`,
        { limit: BUNDLE_SIZE }
      );
      if (!incomplete) break;

      const limit = BUNDLE_SIZE - incomplete.eventCount;
      const toAdd = await client.fetch<Array<Record<string, unknown> & { _id: string }>>(
        `*[_type == "trackingEvent" && createdAt < $cutoff && createdAt > $after] | order(createdAt asc) [0...$limit]{ _id, ${EVENT_FIELDS} }`,
        { cutoff, after: incomplete.timeRangeEnd, limit }
      );
      if (!toAdd.length) break;

      const newEvents = toAdd.map(d => toBundleEvent(d));
      const lastEvent = toAdd[toAdd.length - 1];
      const newTimeRangeEnd = (lastEvent.createdAt as string) ?? incomplete.timeRangeEnd;
      const newEventCount = incomplete.eventCount + toAdd.length;
      const idsToDelete = toAdd.map(e => e._id);
      const tx = client.transaction();
      const now = new Date().toISOString();
      tx.patch(incomplete._id, p =>
        p
          .append("events", newEvents)
          .set({ timeRangeEnd: newTimeRangeEnd, eventCount: newEventCount, updatedAt: now })
      );
      idsToDelete.forEach(id => tx.delete(id));
      await tx.commit();
      appended += toAdd.length;
    }

    const latestBundle = await client.fetch<{ timeRangeEnd: string } | null>(
      `*[_type == "trackingEventBundle"] | order(timeRangeEnd desc) [0]{ timeRangeEnd }`
    );
    let after = latestBundle?.timeRangeEnd ?? "";
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const batch = await client.fetch<Array<Record<string, unknown> & { _id: string }>>(
        after
          ? `*[_type == "trackingEvent" && createdAt < $cutoff && createdAt > $after] | order(createdAt asc) [0...$limit]{ _id, ${EVENT_FIELDS} }`
          : `*[_type == "trackingEvent" && createdAt < $cutoff] | order(createdAt asc) [0...$limit]{ _id, ${EVENT_FIELDS} }`,
        after ? { cutoff, after, limit: BUNDLE_SIZE } : { cutoff, limit: BUNDLE_SIZE }
      );
      if (!batch.length) break;

      const events = batch.map(d => toBundleEvent(d));
      const timeRangeStart = (events[0].createdAt as string) ?? cutoff;
      const timeRangeEnd = (events[events.length - 1].createdAt as string) ?? cutoff;
      after = timeRangeEnd;
      const idsToDelete = batch.map(e => e._id);
      const tx = client.transaction();
      const now = new Date().toISOString();
      tx.create({
        _type: "trackingEventBundle",
        bundledAt: now,
        updatedAt: now,
        timeRangeStart,
        timeRangeEnd,
        eventCount: events.length,
        events
      });
      idsToDelete.forEach(id => tx.delete(id));
      await tx.commit();
      created += 1;
    }

    if (created > 0 || appended > 0) revalidateTag("bundle-counts", "max");
    return { ok: true, created, appended };
  } catch (err) {
    console.error("Bundle-events error:", err);
    return {
      ok: false,
      created,
      appended,
      error: err instanceof Error ? err.message : "Bundling failed"
    };
  }
}
