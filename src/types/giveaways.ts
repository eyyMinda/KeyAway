/**
 * @fileoverview Giveaway discovery: source registry, extracted page data, and `giveawayFind` documents.
 */
import type { ProgramFlow } from "@/src/types/program";

/** `key` of a source in the private settings document, or "watch" for a watch page on an unlisted host. */
export type GiveawaySourceId = string;

interface GiveawaySourceBase {
  id: GiveawaySourceId;
  label: string;
  /** Hostname without `www.` (used to attribute watch URLs and skip same-site links). */
  host: string;
  /** Only read this element of the detail page when present (falls back to the article/body). */
  contentSelector?: string;
  /** Listing items whose title does not match are ignored (e.g. paid deals). */
  titleFilter?: RegExp;
  /** Keys are per person on this site: never extract keys, always report the page link. */
  linkOnly?: boolean;
}

export interface RssGiveawaySource extends GiveawaySourceBase {
  kind: "rss";
  url: string;
  /** Feed items carry the full post body in `content:encoded`, so the detail page is not fetched. */
  contentInFeed?: boolean;
}

export interface WpRestGiveawaySource extends GiveawaySourceBase {
  kind: "wp-rest";
  baseUrl: string;
  postType: string;
  taxonomy: string;
  termIds: number[];
  /** `content.rendered` holds the giveaway details, so the detail page is not fetched. */
  contentInApi: boolean;
  /** Pages are updated in place: re-fetch a known URL when the API `modified` time moves. */
  refetchOnModified?: boolean;
}

/** Host whose pages are only checked through watch pages. */
export interface WatchHostGiveawaySource extends GiveawaySourceBase {
  kind: "watch-host";
}

export type GiveawaySource = RssGiveawaySource | WpRestGiveawaySource | WatchHostGiveawaySource;

/** A page that always hosts one program's giveaway (from the private settings document). */
export interface GiveawayWatchPage {
  /** Array `_key` in the settings document (used to remove it). */
  _key?: string;
  programId: string;
  url: string;
}

/** Watch page with its last check result, for the admin health list. */
export interface GiveawayWatchPageHealth {
  key: string;
  url: string;
  programId: string;
  programTitle?: string;
  sourceLabel?: string;
  checkedAt?: string;
  lastOkAt?: string;
  lastError?: string;
  errorCount: number;
}

/** Source key + label pair sent to the admin page (labels are only exposed to admins). */
export interface GiveawaySourceOption {
  key: string;
  label: string;
}

/** One post/product from a listing source, before the detail page is fetched. */
export interface GiveawayListingItem {
  sourceId: GiveawaySourceId;
  url: string;
  title: string;
  publishedAt?: string;
  modifiedAt?: string;
  /** Post body when the feed/API already includes it. */
  contentHtml?: string;
}

export interface ExtractedAccount {
  username: string;
  password?: string;
}

export interface ExtractedLink {
  url: string;
  label?: string;
}

export interface ExtractedGiveaway {
  keys: string[];
  accounts: ExtractedAccount[];
  links: ExtractedLink[];
  version?: string;
  /** ISO datetime, best effort. */
  validUntil?: string;
  detectedFlow?: ProgramFlow;
  excerpt?: string;
  /** Page `<h1>` or `<title>` (used as the find title for watch pages). */
  pageTitle?: string;
  contentHash: string;
}

export type GiveawayMatchMethod = "watch_url" | "alias" | "title" | "fuzzy" | "manual" | "possible";

export type GiveawayFindStatus = "new" | "reviewing" | "added" | "dismissed";

/** Why the admin ignores an item: activation limit hit, doesn't work, or the giveaway link has expired. */
export type GiveawayIgnoreReason = "limit" | "invalid" | "expired";

export type GiveawayIgnoredItemKind = "key" | "account" | "link";

export interface GiveawayFindKey {
  _key?: string;
  value: string;
  isNew: boolean;
  /** Set when the key is on the ignore list; such keys never count as new. */
  ignoredReason?: GiveawayIgnoreReason;
}

export interface GiveawayFindAccount {
  _key?: string;
  username: string;
  password?: string;
  isNew: boolean;
  ignoredReason?: GiveawayIgnoreReason;
}

export interface GiveawayFindLink {
  _key?: string;
  url: string;
  label?: string;
  isNew: boolean;
  ignoredReason?: GiveawayIgnoreReason;
}

export interface GiveawayFindProgramRef {
  _id: string;
  title: string;
  slug?: string;
  programFlow?: ProgramFlow;
}

export interface GiveawayFindCandidate {
  _key?: string;
  score: number;
  program: GiveawayFindProgramRef | null;
}

/** `giveawayFind` document as returned to the admin page. */
export interface GiveawayFind {
  _id: string;
  sourceId: GiveawaySourceId;
  sourceUrl: string;
  sourceTitle: string;
  publishedAt?: string;
  program: GiveawayFindProgramRef | null;
  matchMethod: GiveawayMatchMethod;
  matchConfidence?: number;
  candidates?: GiveawayFindCandidate[];
  detectedFlow?: ProgramFlow;
  keys?: GiveawayFindKey[];
  accounts?: GiveawayFindAccount[];
  links?: GiveawayFindLink[];
  version?: string;
  validUntil?: string;
  excerpt?: string;
  status: GiveawayFindStatus;
  /** Set when the scan dismissed the find itself (e.g. "expired"). */
  dismissedReason?: string;
  /** Admin GET only: the source page is already a watch page. */
  watched?: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  lastChangedAt?: string;
  notes?: string;
}

export interface GiveawayDiscoveryError {
  sourceId: GiveawaySourceId;
  url?: string;
  message: string;
}

export interface GiveawayDiscoverySummary {
  dryRun: boolean;
  sourcesChecked: number;
  itemsSeen: number;
  itemsSkippedFiltered: number;
  itemsSkippedKnown: number;
  itemsSkippedNoMatch: number;
  itemsAllKnown: number;
  /** New finds skipped because the page says the giveaway already ended. */
  itemsExpired: number;
  /** Watch pages not opened because the site says they haven't changed since the last run. */
  watchUnchanged: number;
  /** Watch pages checked for the first time (or with nothing new), recorded as a baseline without a find. */
  watchBaseline: number;
  /** Open finds dismissed because their giveaway end date passed. */
  findsExpiredDismissed: number;
  detailFetched: number;
  findsCreated: number;
  findsUpdated: number;
  errors: GiveawayDiscoveryError[];
}
