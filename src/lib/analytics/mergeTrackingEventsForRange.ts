import { BUNDLING_RETENTION_MS } from "@/src/lib/analytics/bundlingConstants";
import { client } from "@/src/sanity/lib/client";
import {
  trackingEventsWithRangeSlimQuery,
  trackingEventBundlesSlimQuery
} from "@/src/lib/sanity/queries";
import { AnalyticsEventData } from "@/src/types";

type BundleRow = { _id: string; events: AnalyticsEventData[] };

/**
 * Merges slim singular + date-scoped bundled events for a range.
 * Does not enrich visitor meta — callers enrich only displayed slices.
 */
export async function mergeTrackingEventsForRange(
  since: string,
  until: string
): Promise<AnalyticsEventData[]> {
  const now = Date.now();
  const retentionCutoff = new Date(now - BUNDLING_RETENTION_MS).toISOString();
  const needBundles = since < retentionCutoff;

  const [singular, bundles] = await Promise.all([
    client.fetch<AnalyticsEventData[]>(trackingEventsWithRangeSlimQuery, { since, until }),
    needBundles
      ? client.fetch<BundleRow[]>(trackingEventBundlesSlimQuery, { since, until })
      : Promise.resolve([] as BundleRow[])
  ]);

  const bundleEvents: AnalyticsEventData[] = (bundles ?? []).flatMap(b =>
    (b.events ?? []).map((e, i) => ({
      ...e,
      _id: `${b._id}:${(e as { _key?: string })._key ?? i}`
    }))
  );

  const merged = [...(singular ?? []), ...bundleEvents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return merged;
}
