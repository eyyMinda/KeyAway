import { unstable_cache } from "next/cache";
import { client } from "@/src/sanity/lib/client";
import { DAY_MS, WEEK_MS, isoSince } from "@/src/lib/time";

export const SANITY_DOCUMENT_LIMIT = 10_000;
const CACHE_SECONDS = 600;

/** Document types that exist in this dataset. One count() per type, one HTTP request. */
const DOC_TYPES = [
  "visitor",
  "keyReport",
  "keyReportBundle",
  "cronRun",
  "sanity.imageAsset",
  "trackingSessionBundle",
  "trackingSession",
  "changelogRelease",
  "visitorBundle",
  "program",
  "contactMessage",
  "keySuggestion",
  "programCategory",
  "vendor",
  "socialLink",
  "siteNotificationBundle",
  "headerLink",
  "siteNotificationFeed",
  "featuredProgramSettings",
  "storeDetails",
  "analyticsMigration",
  "footer",
  "header",
  "system.group",
  "system.retention",
  "system.schema"
] as const;

const datasetDocCountsQuery = `{
  "total": count(*),
  "day": count(*[_createdAt >= $day]),
  "week": count(*[_createdAt >= $week]),
  ${DOC_TYPES.map(
    type =>
      `"${type}": count(*[_type == "${type}"]), "${type}__d": count(*[_type == "${type}" && _createdAt >= $day]), "${type}__w": count(*[_type == "${type}" && _createdAt >= $week])`
  ).join(",\n  ")}
}`;

export type DatasetDocCount = { type: string; count: number; day: number; week: number };

export type DatasetDocCounts = {
  total: number;
  day: number;
  week: number;
  limit: number;
  counts: DatasetDocCount[];
};

async function loadDatasetDocCounts(): Promise<DatasetDocCounts> {
  const now = Date.now();
  const raw = await client.withConfig({ useCdn: false }).fetch<Record<string, number>>(datasetDocCountsQuery, {
    day: isoSince(DAY_MS, now),
    week: isoSince(WEEK_MS, now)
  });
  const total = raw?.total ?? 0;
  const counts = DOC_TYPES.map(type => ({
    type,
    count: raw?.[type] ?? 0,
    day: raw?.[`${type}__d`] ?? 0,
    week: raw?.[`${type}__w`] ?? 0
  }))
    .filter(row => row.count > 0)
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
  return {
    total,
    day: raw?.day ?? 0,
    week: raw?.week ?? 0,
    limit: SANITY_DOCUMENT_LIMIT,
    counts
  };
}

export const getCachedDatasetDocCounts = unstable_cache(loadDatasetDocCounts, ["admin-dataset-doc-counts-v2"], {
  revalidate: CACHE_SECONDS
});
