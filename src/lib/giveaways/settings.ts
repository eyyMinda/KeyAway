import { mutationClient } from "@/src/lib/sanity/mutationClient";
import { GIVEAWAY_DISCOVERY_SETTINGS_ID } from "./constants";
import type { GiveawaySource, GiveawaySourceOption, GiveawayWatchPage } from "@/src/types/giveaways";

type SourceRow = {
  key?: string;
  label?: string;
  enabled?: boolean;
  kind?: string;
  url?: string;
  wpPostType?: string;
  wpTaxonomy?: string;
  wpTermIds?: number[];
  listingIncludesContent?: boolean;
  refetchOnModified?: boolean;
  contentSelector?: string;
  titleFilter?: string;
  linkOnly?: boolean;
};

export type GiveawayDiscoveryConfig = {
  /** Enabled, valid sources. */
  sources: GiveawaySource[];
  /** Every configured source (including disabled ones), for labelling older finds in the admin. */
  sourceLabels: GiveawaySourceOption[];
  watchPages: GiveawayWatchPage[];
};

/** Prefer the published settings; fall back to an unpublished draft so a fresh setup works before publishing. */
const settingsQuery = `coalesce(
  *[_id == $id][0],
  *[_id == "drafts." + $id][0]
){
  sources[]{key, label, enabled, kind, url, wpPostType, wpTaxonomy, wpTermIds, listingIncludesContent, refetchOnModified, contentSelector, titleFilter, linkOnly},
  "watchPages": watchPages[]{_key, "programId": program._ref, url}
}`;

export function stripWww(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

function hostOf(url: string): string | null {
  try {
    return stripWww(new URL(url).hostname);
  } catch {
    return null;
  }
}

function toSource(row: SourceRow): GiveawaySource | null {
  if (!row.key || !row.url || row.enabled === false) return null;
  const host = hostOf(row.url);
  if (!host) return null;
  let titleFilter: RegExp | undefined;
  if (row.titleFilter) {
    try {
      titleFilter = new RegExp(row.titleFilter, "i");
    } catch {
      titleFilter = undefined;
    }
  }
  const base = {
    id: row.key,
    label: row.label || row.key,
    host,
    contentSelector: row.contentSelector || undefined,
    titleFilter,
    linkOnly: Boolean(row.linkOnly)
  };
  if (row.kind === "rss") {
    return { ...base, kind: "rss", url: row.url, contentInFeed: Boolean(row.listingIncludesContent) };
  }
  if (row.kind === "wp-rest") {
    if (!row.wpPostType || !row.wpTaxonomy) return null;
    return {
      ...base,
      kind: "wp-rest",
      baseUrl: row.url.replace(/\/+$/, ""),
      postType: row.wpPostType,
      taxonomy: row.wpTaxonomy,
      termIds: row.wpTermIds ?? [],
      contentInApi: Boolean(row.listingIncludesContent),
      refetchOnModified: Boolean(row.refetchOnModified)
    };
  }
  if (row.kind === "watch-host") return { ...base, kind: "watch-host" };
  return null;
}

/** Server-only: reads the private settings document with the API token. */
export async function loadDiscoveryConfig(): Promise<GiveawayDiscoveryConfig> {
  const row = await mutationClient.fetch<{
    sources?: SourceRow[] | null;
    watchPages?: { _key?: string; programId?: string; url?: string }[] | null;
  } | null>(settingsQuery, { id: GIVEAWAY_DISCOVERY_SETTINGS_ID });

  return {
    sources: (row?.sources ?? []).map(toSource).filter((s): s is GiveawaySource => s !== null),
    sourceLabels: (row?.sources ?? [])
      .filter(s => s.key)
      .map(s => ({ key: s.key!, label: s.label || s.key! })),
    watchPages: (row?.watchPages ?? [])
      .filter((w): w is GiveawayWatchPage => Boolean(w?.programId && w?.url))
      .map(w => ({ _key: w._key, programId: w.programId, url: w.url }))
  };
}

/** Source registered for the URL's host, if any. */
export function findSourceForUrl(sources: GiveawaySource[], url: string): GiveawaySource | undefined {
  const host = hostOf(url);
  if (!host) return undefined;
  return sources.find(s => host === s.host || host.endsWith(`.${s.host}`));
}
