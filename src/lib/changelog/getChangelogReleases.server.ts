import { unstable_cache } from "next/cache";
import type { ChangelogRelease } from "@/src/lib/changelog/changelogEntries";
import { fetchChangelogReleasesFromGitHub } from "@/src/lib/changelog/fetchChangelogFromGitHub";
import { TAG_CHANGELOG } from "@/src/lib/cache/cacheTags";
import { publishedChangelogReleasesQuery } from "@/src/lib/sanity/queries/changelog";
import { client } from "@/src/sanity/lib/client";

type SanityChangelogRow = {
  id: string;
  releasedAt: string;
  title: string;
  prNumber: number;
  tags: ChangelogRelease["tags"];
  summary: string;
  highlights: string[] | null;
  sections: Array<{ title: string; items: string[] }> | null;
};

function mapSanityRow(row: SanityChangelogRow): ChangelogRelease {
  const sections =
    row.sections?.filter(section => section.title && section.items?.length) ?? undefined;

  return {
    id: row.id,
    releasedAt: row.releasedAt,
    title: row.title,
    prNumber: row.prNumber,
    tags: row.tags ?? [],
    summary: row.summary,
    highlights: row.highlights?.length ? row.highlights : [row.summary],
    sections: sections?.length ? sections : undefined
  };
}

async function fetchChangelogReleasesFromSanity(): Promise<ChangelogRelease[]> {
  const rows = await client.fetch<SanityChangelogRow[]>(
    publishedChangelogReleasesQuery,
    {},
    { next: { tags: [TAG_CHANGELOG] } }
  );

  return rows.map(mapSanityRow);
}

async function loadChangelogReleases(): Promise<ChangelogRelease[]> {
  const fromSanity = await fetchChangelogReleasesFromSanity();
  if (fromSanity.length > 0) return fromSanity;

  return fetchChangelogReleasesFromGitHub(50);
}

export const getCachedChangelogReleases = unstable_cache(
  loadChangelogReleases,
  ["changelog-releases"],
  { revalidate: 43200, tags: [TAG_CHANGELOG] }
);
