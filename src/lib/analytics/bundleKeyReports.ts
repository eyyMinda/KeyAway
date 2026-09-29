/** @fileoverview Cron: moves key reports older than retention into `keyReportBundle`, deletes sources. */
import { randomUUID } from "node:crypto";
import { KEY_REPORT_BUNDLE_CAPACITY, KEY_REPORT_RETENTION_MS } from "@/src/lib/analytics/bundlingConstants";
import { client } from "@/src/sanity/lib/client";
import { isoSince } from "@/src/lib/time";

const BATCH = 100;
const MAX_ITERATIONS = 30;

/** Uses coalesce so pre-`createdAt` docs still sort and archive by their document creation time. */
const REPORT_FIELDS =
  'eventType, programSlug, key, label, path, referrer, userAgent, country, city, utm_source, utm_medium, utm_campaign, ipHash, listedVersion, triedVersionFit, triedVersion, "createdAt": coalesce(createdAt, _createdAt)';

type LiveReport = Record<string, unknown> & { _id: string; createdAt?: string };

function toBundledReport(doc: LiveReport) {
  const { _id, createdAt, ...rest } = doc;
  return { _type: "bundledKeyReport", _key: randomUUID(), sourceId: _id, createdAt, ...rest };
}

/** Bundle key reports with createdAt older than retention (7 days). */
export async function runBundleKeyReports(): Promise<{ ok: boolean; bundled: number; error?: string }> {
  const cutoff = isoSince(KEY_REPORT_RETENTION_MS);
  let bundled = 0;

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const open = await client.fetch<{
        _id: string;
        reportCount: number;
        capacity?: number;
        timeRangeEnd?: string;
      } | null>(
        `*[_type == "keyReportBundle" && count(reports) < coalesce(capacity, $cap)] | order(timeRangeStart asc)[0]{
          _id, "reportCount": count(reports), capacity, timeRangeEnd
        }`,
        { cap: KEY_REPORT_BUNDLE_CAPACITY }
      );

      const room = open ? (open.capacity ?? KEY_REPORT_BUNDLE_CAPACITY) - open.reportCount : BATCH;
      const limit = Math.min(BATCH, Math.max(room, 0));
      if (open && limit <= 0) break;

      const docs = await client.fetch<LiveReport[]>(
        `*[_type == "keyReport" && coalesce(createdAt, _createdAt) < $cutoff] | order(coalesce(createdAt, _createdAt) asc) [0...$limit]{
          _id, ${REPORT_FIELDS}
        }`,
        { cutoff, limit: open ? limit : BATCH }
      );
      if (!docs.length) break;

      const reports = docs.map(toBundledReport);
      const start = docs[0].createdAt ?? cutoff;
      const end = docs[docs.length - 1].createdAt ?? cutoff;
      const now = new Date().toISOString();
      const tx = client.transaction();

      if (open) {
        tx.patch(open._id, p =>
          p.append("reports", reports).set({
            reportCount: open.reportCount + reports.length,
            timeRangeEnd: end > (open.timeRangeEnd ?? "") ? end : open.timeRangeEnd,
            updatedAt: now
          })
        );
      } else {
        tx.create({
          _type: "keyReportBundle",
          bundledAt: now,
          updatedAt: now,
          timeRangeStart: start,
          timeRangeEnd: end,
          reportCount: reports.length,
          capacity: KEY_REPORT_BUNDLE_CAPACITY,
          reports
        });
      }

      for (const doc of docs) tx.delete(doc._id);
      await tx.commit();
      bundled += docs.length;
    }

    return { ok: true, bundled };
  } catch (err) {
    console.error("[bundle-key-reports]", err);
    return { ok: false, bundled, error: err instanceof Error ? err.message : "Key report bundling failed" };
  }
}
