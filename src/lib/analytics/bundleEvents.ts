/** @fileoverview Cron/migration: moves old `trackingEvent` docs into `trackingEventBundle`, deletes sources, optional retention window. */
import { randomUUID } from "node:crypto";
import {
  BUNDLE_MAX_ITERATIONS,
  EVENT_BUNDLE_BATCH,
  EVENT_BUNDLE_CAPACITY,
  EVENT_BUNDLING_RETENTION_HOURS,
  LEGACY_EVENT_BUNDLE_SIZE
} from "@/src/lib/analytics/bundlingConstants";
import { TAG_BUNDLE_COUNTS } from "@/src/lib/cache/cacheTags";
import { revalidateTag } from "next/cache";
import { client } from "@/src/sanity/lib/client";

const EVENT_FIELDS =
  "event, programSlug, notFound, path, referrer, country, city, social, key, activationUrl, programFlow, userAgent, ipHash, utm_source, utm_medium, utm_campaign, createdAt";

type IncompleteBundle = {
  _id: string;
  eventCount: number;
  timeRangeEnd: string;
  capacity?: number;
};

function bundleCapacity(doc: { capacity?: number; eventCount: number }): number {
  return typeof doc.capacity === "number" && doc.capacity > 0 ? doc.capacity : LEGACY_EVENT_BUNDLE_SIZE;
}

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
    key: doc.key,
    activationUrl: doc.activationUrl,
    programFlow: doc.programFlow,
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

async function fetchEventsToBundle(
  cutoff: string,
  after: string,
  limit: number
): Promise<Array<Record<string, unknown> & { _id: string }>> {
  return client.fetch<Array<Record<string, unknown> & { _id: string }>>(
    after
      ? `*[_type == "trackingEvent" && createdAt < $cutoff && createdAt > $after] | order(createdAt asc) [0...$limit]{ _id, ${EVENT_FIELDS} }`
      : `*[_type == "trackingEvent" && createdAt < $cutoff] | order(createdAt asc) [0...$limit]{ _id, ${EVENT_FIELDS} }`,
    after ? { cutoff, after, limit } : { cutoff, limit }
  );
}

/** Runs the event bundling process. Uses retention cutoff (12h) by default. Set skipRetention=true for one-time migration. */
export async function runBundleEvents(skipRetention = false): Promise<BundleEventsResult> {
  const cutoff = skipRetention
    ? new Date(Date.now() + 864e5).toISOString() // future = bundle all
    : new Date(Date.now() - EVENT_BUNDLING_RETENTION_HOURS * 3600e3).toISOString();
  let created = 0;
  let appended = 0;

  try {
    for (let i = 0; i < BUNDLE_MAX_ITERATIONS; i++) {
      const incomplete = await client.fetch<IncompleteBundle | null>(
        `*[_type == "trackingEventBundle" && eventCount < coalesce(capacity, $legacy)] | order(timeRangeEnd desc) [0]{ _id, eventCount, timeRangeEnd, capacity }`,
        { legacy: LEGACY_EVENT_BUNDLE_SIZE }
      );

      if (incomplete) {
        const cap = bundleCapacity(incomplete);
        const room = cap - incomplete.eventCount;
        const limit = Math.min(EVENT_BUNDLE_BATCH, room);
        if (limit <= 0) break;

        const toAdd = await fetchEventsToBundle(cutoff, incomplete.timeRangeEnd, limit);
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
        continue;
      }

      const latestBundle = await client.fetch<{ timeRangeEnd: string } | null>(
        `*[_type == "trackingEventBundle"] | order(timeRangeEnd desc) [0]{ timeRangeEnd }`
      );
      const after = latestBundle?.timeRangeEnd ?? "";
      const batch = await fetchEventsToBundle(cutoff, after, EVENT_BUNDLE_BATCH);
      if (!batch.length) break;

      const events = batch.map(d => toBundleEvent(d));
      const timeRangeStart = (events[0].createdAt as string) ?? cutoff;
      const timeRangeEnd = (events[events.length - 1].createdAt as string) ?? cutoff;
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
        capacity: EVENT_BUNDLE_CAPACITY,
        events
      });
      idsToDelete.forEach(id => tx.delete(id));
      await tx.commit();
      created += 1;
    }

    if (created > 0 || appended > 0) revalidateTag(TAG_BUNDLE_COUNTS, "max");
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
