import type { Transaction } from "@sanity/client";
import { mutationClient } from "@/src/lib/sanity/mutationClient";
import type {
  ExtractedGiveaway,
  GiveawayDiscoverySummary,
  GiveawayFindAccount,
  GiveawayFindKey,
  GiveawayFindLink,
  GiveawayListingItem,
  GiveawayMatchMethod,
  GiveawaySource,
  GiveawaySourceId
} from "@/src/types/giveaways";
import { addedValues, existingEntriesOf, flagItems, giveawayFindId, hasNewActivation, hasSomethingNew, mergeItems, withKeys } from "./dedupe";
import { extractGiveaway } from "./extract";
import { loadIgnoredItems } from "./ignoredItems";
import { GIVEAWAY_WATCH_STATE_ID } from "./constants";
import { fetchModified, loadWatchState, watchStateRows, wpApiRefFromHtml, type WatchStateEntry } from "./watchState";
import { fetchRssListing, fetchWpRestListing } from "./listings";
import { createProgramMatcher, normalizeUrl, type DiscoveryProgram, type IndexedProgram, type MatchResult } from "./matchProgram";
import { createRobotsChecker, politeFetch } from "./politeFetch";
import { findSourceForUrl, loadDiscoveryConfig, stripWww } from "./settings";

const MAX_DETAIL_FETCHES = 60;
const HOST_CONCURRENCY = 4;
/** Stop starting new page fetches after this, so the function finishes well inside maxDuration. */
const TIME_BUDGET_MS = 45_000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Listing posts older than this are not opened unless we already track them. */
const RECENT_WINDOW_MS = 7 * DAY_MS;
/** Link-only finds this young are re-checked daily (some sites add the key hours after posting). */
const RECHECK_EMPTY_MS = 3 * DAY_MS;

const discoveryProgramsQuery = `*[_type == "program" && !(_id in path("drafts.**"))]{
  _id, title, "slug": slug.current, programFlow,
  vendor->{name, aliases},
  giveawayDiscovery,
  cdKeys[]{key, username, giveawayLinks[]{url}}
}`;

const existingFindsQuery = `*[_type == "giveawayFind"]{
  _id, status, contentHash, sourceModifiedAt, firstSeenAt, matchMethod, validUntil,
  "programId": program._ref,
  keys[]{value, isNew, ignoredReason}, accounts[]{username, password, isNew, ignoredReason}, links[]{url, label, isNew, ignoredReason}
}`;

type ExistingFind = {
  _id: string;
  status: string;
  validUntil?: string;
  contentHash?: string;
  sourceModifiedAt?: string;
  firstSeenAt?: string;
  matchMethod?: GiveawayMatchMethod;
  programId?: string;
  keys?: GiveawayFindKey[];
  accounts?: GiveawayFindAccount[];
  links?: GiveawayFindLink[];
};

/** Watch page context for this run: first time we see it, and whether the site reports a change. */
type WatchContext = { firstSight: boolean; pageChanged: boolean };

type WorkItem = {
  sourceId: GiveawaySourceId;
  source?: GiveawaySource;
  url: string;
  title: string;
  publishedAt?: string;
  modifiedAt?: string;
  contentHtml?: string;
  match: Exclude<MatchResult, null>;
  watch: boolean;
  /** Watch pages: the site's current `modified` time, when known before fetching. */
  knownModified?: string;
};

export type DiscoveryFindPreview = {
  id: string;
  action: "create" | "update" | "touch";
  sourceId: GiveawaySourceId;
  url: string;
  title: string;
  program?: string;
  matchMethod: GiveawayMatchMethod;
  candidates?: string[];
  keys: GiveawayFindKey[];
  accounts: GiveawayFindAccount[];
  links: GiveawayFindLink[];
  version?: string;
  validUntil?: string;
  detectedFlow?: string;
};

export type DiscoveryResult = { summary: GiveawayDiscoverySummary; finds: DiscoveryFindPreview[] };

function isRecent(iso: string | undefined, windowMs: number, now: number): boolean {
  if (!iso) return true;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) || now - ms <= windowMs;
}

function hostOf(url: string): string {
  try {
    return stripWww(new URL(url).hostname);
  } catch {
    return url;
  }
}

/** Runs `worker` over items with at most `limit` hosts in parallel and one request at a time per host. */
async function runByHost<T extends { url: string }>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  const queues = new Map<string, T[]>();
  for (const item of items) {
    const host = hostOf(item.url);
    queues.set(host, [...(queues.get(host) ?? []), item]);
  }
  const hosts = [...queues.keys()];
  const runners = Array.from({ length: Math.min(limit, hosts.length) }, async () => {
    for (let host = hosts.shift(); host; host = hosts.shift()) {
      for (const item of queues.get(host)!) await worker(item);
    }
  });
  await Promise.all(runners);
}

function programsFor(match: Exclude<MatchResult, null>): IndexedProgram[] {
  return match.kind === "matched" ? [match.program] : match.candidates.map(c => c.program);
}

function matchFields(match: Exclude<MatchResult, null>) {
  if (match.kind === "matched") {
    return {
      program: { _type: "reference", _ref: match.program.program._id, _weak: true },
      matchMethod: match.method,
      matchConfidence: match.confidence,
      candidates: []
    };
  }
  return {
    matchMethod: "possible" as const,
    matchConfidence: match.candidates[0]?.score ?? 0,
    candidates: match.candidates.map((c, i) => ({
      _key: `c${i}`,
      program: { _type: "reference", _ref: c.program.program._id, _weak: true },
      score: c.score
    }))
  };
}

export async function runDiscovery(opts: { dryRun?: boolean; sourceIds?: GiveawaySourceId[] } = {}): Promise<DiscoveryResult> {
  const started = Date.now();
  const dryRun = Boolean(opts.dryRun);
  const summary: GiveawayDiscoverySummary = {
    dryRun,
    sourcesChecked: 0,
    itemsSeen: 0,
    itemsSkippedFiltered: 0,
    itemsSkippedKnown: 0,
    itemsSkippedNoMatch: 0,
    itemsAllKnown: 0,
    itemsExpired: 0,
    watchUnchanged: 0,
    watchBaseline: 0,
    findsExpiredDismissed: 0,
    detailFetched: 0,
    findsCreated: 0,
    findsUpdated: 0,
    errors: []
  };
  const finds: DiscoveryFindPreview[] = [];

  const [config, ignored, watchState, programs, existing] = await Promise.all([
    loadDiscoveryConfig(),
    loadIgnoredItems(),
    loadWatchState(),
    mutationClient.fetch<DiscoveryProgram[]>(discoveryProgramsQuery),
    mutationClient.fetch<ExistingFind[]>(existingFindsQuery)
  ]);
  const matcher = createProgramMatcher(programs ?? [], config.watchPages);
  const existingById = new Map((existing ?? []).map(f => [f._id, f]));
  const isAllowed = createRobotsChecker();
  const wanted = (id: GiveawaySourceId) => !opts.sourceIds?.length || opts.sourceIds.includes(id);

  // 1. Watch pages (private settings). Pages whose WordPress REST entry we know are only opened
  //    when the site reports a newer `modified` time; one lookup per site covers all of its pages.
  const work: WorkItem[] = [];
  const watchUrls = new Set<string>();
  const watchItems: WorkItem[] = [];
  for (const page of config.watchPages) {
    const ip = matcher.matchWatchUrl(page.url);
    if (!ip) continue;
    const source = findSourceForUrl(config.sources, page.url);
    const sourceId = source?.id ?? "watch";
    watchUrls.add(normalizeUrl(page.url));
    if (!wanted(sourceId)) continue;
    watchItems.push({
      sourceId,
      source,
      url: page.url,
      title: ip.program.title,
      match: { kind: "matched", program: ip, method: "watch_url", confidence: 1 },
      watch: true
    });
  }
  let watchStateChanged = false;
  const byApi = new Map<string, { item: WorkItem; state: WatchStateEntry }[]>();
  for (const item of watchItems) {
    const state = watchState.get(normalizeUrl(item.url));
    if (state?.api && state.postId) byApi.set(state.api, [...(byApi.get(state.api) ?? []), { item, state }]);
    else work.push(item);
  }
  await Promise.all(
    [...byApi.entries()].map(async ([api, rows]) => {
      const modified = (await isAllowed(api)) ? await fetchModified(api, rows.map(r => r.state.postId!)) : null;
      for (const { item, state } of rows) {
        const current = modified?.get(state.postId!);
        if (current && state.modified && current === state.modified) {
          summary.watchUnchanged++;
          continue;
        }
        work.push({ ...item, knownModified: current });
      }
    })
  );

  // 2. Listing sources: discover post URLs, keep only those whose title matches an existing program.
  const listingSources = config.sources.filter(s => s.kind !== "watch-host" && wanted(s.id));
  const listings = await Promise.all(
    listingSources.map(async source => {
      try {
        const listingUrl = source.kind === "rss" ? source.url : source.kind === "wp-rest" ? source.baseUrl : "";
        if (listingUrl && !(await isAllowed(listingUrl))) throw new Error("blocked by robots.txt");
        const items =
          source.kind === "rss" ? await fetchRssListing(source) : source.kind === "wp-rest" ? await fetchWpRestListing(source) : [];
        summary.sourcesChecked++;
        return { source, items };
      } catch (err) {
        summary.errors.push({ sourceId: source.id, message: err instanceof Error ? err.message : String(err) });
        return { source, items: [] as GiveawayListingItem[] };
      }
    })
  );
  if (work.length) summary.sourcesChecked++;

  for (const { source, items } of listings) {
    for (const item of items) {
      summary.itemsSeen++;
      if (source.titleFilter && !source.titleFilter.test(item.title)) {
        summary.itemsSkippedFiltered++;
        continue;
      }
      const norm = normalizeUrl(item.url);
      if (watchUrls.has(norm)) continue;

      const prev = existingById.get(giveawayFindId(item.url));
      const refetchOnModified = source.kind === "wp-rest" && source.refetchOnModified;
      if (prev) {
        const modifiedSince =
          refetchOnModified &&
          item.modifiedAt &&
          (!prev.sourceModifiedAt || Date.parse(item.modifiedAt) > Date.parse(prev.sourceModifiedAt));
        const youngEmpty =
          prev.status === "new" &&
          !prev.keys?.length &&
          !prev.accounts?.length &&
          isRecent(prev.firstSeenAt, RECHECK_EMPTY_MS, started);
        if (!modifiedSince && !youngEmpty) {
          summary.itemsSkippedKnown++;
          continue;
        }
      } else if (!isRecent(refetchOnModified ? item.modifiedAt : item.publishedAt, RECENT_WINDOW_MS, started)) {
        summary.itemsSkippedKnown++;
        continue;
      }

      const match = matcher.matchTitle(item.title);
      if (!match) {
        summary.itemsSkippedNoMatch++;
        continue;
      }
      work.push({ ...item, source, match, watch: false });
    }
  }

  // 3. Fetch pages that are not already in the feed/API, then extract, dedupe, and stage writes.
  const tx: Transaction = mutationClient.transaction();

  // Open finds whose giveaway already ended are no longer actionable.
  for (const f of existingById.values()) {
    if ((f.status === "new" || f.status === "reviewing") && f.validUntil && Date.parse(f.validUntil) < started) {
      tx.patch(f._id, p => p.set({ status: "dismissed", dismissedReason: "expired" }));
      f.status = "dismissed";
      summary.findsExpiredDismissed++;
    }
  }
  let fetchBudget = MAX_DETAIL_FETCHES;
  const nowIso = new Date().toISOString();

  const handle = async (item: WorkItem) => {
    let html = item.contentHtml;
    if (!html) {
      if (fetchBudget <= 0 || Date.now() - started > TIME_BUDGET_MS) {
        summary.errors.push({ sourceId: item.sourceId, url: item.url, message: "skipped: fetch budget reached" });
        return;
      }
      if (!(await isAllowed(item.url))) {
        summary.errors.push({ sourceId: item.sourceId, url: item.url, message: "blocked by robots.txt" });
        return;
      }
      fetchBudget--;
      const res = await politeFetch(item.url);
      summary.detailFetched++;
      // WordPress answers a deleted/renamed page with a redirect (often to the homepage): for a watch
      // page that means it's gone, not that the homepage is the giveaway.
      const movedTo =
        res.ok && item.watch && normalizeUrl(res.finalUrl) !== normalizeUrl(item.url) ? res.finalUrl : null;
      if (!res.ok || movedTo) {
        const message = res.ok ? `redirects to ${movedTo}` : res.error;
        summary.errors.push({ sourceId: item.sourceId, url: item.url, message });
        if (item.watch) {
          // Remember the failure so broken watch pages show up in the admin.
          const key = normalizeUrl(item.url);
          const before = watchState.get(key);
          watchState.set(key, {
            ...before,
            url: key,
            checkedAt: nowIso,
            lastError: message.slice(0, 200),
            errorCount: (before?.errorCount ?? 0) + 1
          });
          watchStateChanged = true;
        }
        return;
      }
      html = res.text;
    }

    let extracted: ExtractedGiveaway;
    try {
      extracted = extractGiveaway({ html, pageUrl: item.url, title: item.title, source: item.source });
    } catch (err) {
      summary.errors.push({ sourceId: item.sourceId, url: item.url, message: `extract failed: ${String(err)}` });
      return;
    }
    let watchCtx: WatchContext | undefined;
    if (item.watch) {
      const ref = wpApiRefFromHtml(html);
      const key = normalizeUrl(item.url);
      const before = watchState.get(key);
      watchCtx = {
        firstSight: !before,
        pageChanged: Boolean(before?.modified && item.knownModified && before.modified !== item.knownModified)
      };
      watchState.set(key, {
        url: key,
        ...(ref && { api: ref.api, postId: ref.postId }),
        ...(item.knownModified && { modified: item.knownModified }),
        checkedAt: nowIso,
        lastOkAt: nowIso,
        errorCount: 0
      });
      watchStateChanged = true;
    }
    stageFind(item, extracted, watchCtx);
  };

  const stageFind = (item: WorkItem, extracted: ExtractedGiveaway, watchCtx?: WatchContext) => {
    const id = giveawayFindId(item.url);
    const prev = existingById.get(id);
    const title = item.watch ? extracted.pageTitle || item.title : item.title;

    // A manual assignment in the admin wins over whatever the matcher thinks now.
    const manualProgram = prev?.matchMethod === "manual" && prev.programId ? matcher.byId.get(prev.programId) : undefined;
    const match: Exclude<MatchResult, null> = manualProgram
      ? { kind: "matched", program: manualProgram, method: "title", confidence: 1 }
      : item.match;
    const against = programsFor(match).map(ip => existingEntriesOf(ip.program));
    const flagged = flagItems(extracted, against, ignored);

    const detail = {
      detectedFlow: extracted.detectedFlow,
      version: extracted.version,
      validUntil: extracted.validUntil,
      excerpt: extracted.excerpt,
      contentHash: extracted.contentHash,
      ...(item.modifiedAt && { sourceModifiedAt: item.modifiedAt })
    };
    const preview = (action: DiscoveryFindPreview["action"], items = flagged): DiscoveryFindPreview => ({
      id,
      action,
      sourceId: item.sourceId,
      url: item.url,
      title,
      program: match.kind === "matched" ? match.program.program.title : undefined,
      matchMethod: manualProgram ? "manual" : match.kind === "matched" ? match.method : "possible",
      candidates: match.kind === "possible" ? match.candidates.map(c => `${c.program.program.title} (${c.score})`) : undefined,
      keys: items.keys,
      accounts: items.accounts,
      links: items.links,
      version: extracted.version,
      validUntil: extracted.validUntil,
      detectedFlow: extracted.detectedFlow
    });

    // Watch pages are permanent and often hide keys behind a "claim" button. Without new keys/accounts:
    // the first check only records a baseline; later, an empty page is reported when the site says it
    // changed (likely a new round), and a link-only page when a new giveaway link shows up.
    const extractedNothing = !flagged.keys.length && !flagged.accounts.length && !flagged.links.length;
    if (!prev && watchCtx && !hasNewActivation(flagged)) {
      const worthIt = !watchCtx.firstSight && (extractedNothing ? watchCtx.pageChanged : hasSomethingNew(flagged));
      if (!worthIt) {
        summary.watchBaseline++;
        return;
      }
    }

    if (!prev) {
      // Everything found is already on the program or ignored (limit/invalid/expired): nothing to report.
      if (!hasSomethingNew(flagged)) {
        summary.itemsAllKnown++;
        return;
      }
      if (extracted.validUntil && Date.parse(extracted.validUntil) < started) {
        summary.itemsExpired++;
        return;
      }
      const doc: { _id: string; _type: string; [field: string]: unknown } = {
        _id: id,
        _type: "giveawayFind",
        status: "new",
        sourceId: item.sourceId,
        sourceUrl: item.url,
        sourceTitle: title,
        ...(item.publishedAt && { publishedAt: item.publishedAt }),
        ...matchFields(match),
        ...detail,
        keys: withKeys(flagged.keys, "k"),
        accounts: withKeys(flagged.accounts, "a"),
        links: withKeys(flagged.links, "l"),
        firstSeenAt: nowIso,
        lastSeenAt: nowIso,
        lastChangedAt: nowIso
      };
      tx.createIfNotExists(doc);
      summary.findsCreated++;
      finds.push(preview("create"));
      return;
    }

    const added = addedValues(prev, flagged);
    // A watch page with nothing readable that the site reports as changed: worth another look.
    const pageUpdated = Boolean(watchCtx?.pageChanged && extractedNothing);
    if (prev.contentHash === extracted.contentHash && !added.length && !pageUpdated) {
      tx.patch(id, p => p.set({ lastSeenAt: nowIso, ...(item.modifiedAt && { sourceModifiedAt: item.modifiedAt }) }));
      finds.push(preview("touch"));
      return;
    }

    const merged = flagItems(mergeItems(prev, flagged), against, ignored);
    const reopen = Boolean(added.length || pageUpdated);
    tx.patch(id, p => {
      const patch = p.set({
        ...(manualProgram ? {} : matchFields(match)),
        ...detail,
        sourceTitle: title,
        keys: withKeys(merged.keys, "k"),
        accounts: withKeys(merged.accounts, "a"),
        links: withKeys(merged.links, "l"),
        lastSeenAt: nowIso,
        lastChangedAt: nowIso,
        // New keys on a page we already track are always worth a look, even if it was dismissed.
        ...(reopen && { status: "new" })
      });
      return reopen ? patch.unset(["dismissedReason"]) : patch;
    });
    summary.findsUpdated++;
    finds.push(preview("update", merged));
  };

  await runByHost(work, HOST_CONCURRENCY, handle);

  // Pages opened for the first time: look up their `modified` time now so the next run can skip them.
  const missing = new Map<string, WatchStateEntry[]>();
  for (const entry of watchState.values()) {
    if (entry.api && entry.postId && !entry.modified && watchUrls.has(entry.url)) {
      missing.set(entry.api, [...(missing.get(entry.api) ?? []), entry]);
    }
  }
  await Promise.all(
    [...missing.entries()].map(async ([api, entries]) => {
      const modified = await fetchModified(api, entries.map(e => e.postId!));
      for (const entry of entries) {
        const current = modified?.get(entry.postId!);
        if (current) entry.modified = current;
      }
    })
  );
  if (watchStateChanged || [...watchState.keys()].some(url => !watchUrls.has(url))) {
    tx.createIfNotExists({ _id: GIVEAWAY_WATCH_STATE_ID, _type: "giveawayWatchState", entries: [] });
    tx.patch(GIVEAWAY_WATCH_STATE_ID, p => p.set({ entries: watchStateRows(watchState, watchUrls) }));
    watchStateChanged = true;
  }

  if (
    !dryRun &&
    (summary.findsCreated || summary.findsUpdated || summary.findsExpiredDismissed || finds.length || watchStateChanged)
  ) {
    await tx.commit({ visibility: "async" });
  }

  return { summary, finds };
}

/** Short one-line summary for `cronRun.details`. */
export function formatDiscoverySummary(s: GiveawayDiscoverySummary): string {
  const parts = [
    `sources ${s.sourcesChecked}`,
    `seen ${s.itemsSeen}`,
    `no match ${s.itemsSkippedNoMatch}`,
    `fetched ${s.detailFetched}`,
    `created ${s.findsCreated}`,
    `updated ${s.findsUpdated}`
  ];
  if (s.itemsAllKnown) parts.push(`all known ${s.itemsAllKnown}`);
  if (s.itemsExpired) parts.push(`expired ${s.itemsExpired}`);
  if (s.watchUnchanged) parts.push(`watch unchanged ${s.watchUnchanged}`);
  if (s.watchBaseline) parts.push(`watch baseline ${s.watchBaseline}`);
  if (s.findsExpiredDismissed) parts.push(`expired dismissed ${s.findsExpiredDismissed}`);
  // cronRun docs are publicly readable: counts only, never source names or URLs.
  if (s.errors.length) parts.push(`errors ${s.errors.length}`);
  return parts.join(", ").slice(0, 400);
}
