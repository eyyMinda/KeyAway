/**
 * @fileoverview Key report review: which keys probably need a status change, and which reports look doubtful.
 *
 * Every report is weighted by how recent it is (half-life 10 days) and how far its visitor can be trusted (spammers
 * count for nothing, new visitors less than regulars, someone reporting many keys broken in a day half). The version
 * a visitor tried decides what a failure means:
 * - on the key's listed version (or unknown): the key itself may be dead → expired / limit reached;
 * - on the program's latest version while the key is listed for an older one: the key is outdated → also a status
 *   change, not a doubtful report;
 * - on a version newer than the latest official one: the report is doubtful.
 * Pure functions; `keyReview.server.ts` loads the data.
 */
import { parseListedVersionForCompare, shortVersionToTenths } from "@/src/lib/program/versionFitLabel";
import type { CDKeyStatus } from "@/src/types/program";

export const REVIEW_WINDOW_DAYS = 30;
const HALF_LIFE_DAYS = 10;
const DAY = 24 * 60 * 60 * 1000;
/** Distinct visitors needed before a key's status is questioned. */
const MIN_REPORTERS = 3;
/** Broken-key reports within a day that make a visitor doubtful: many in total, or several across programs. */
const MASS_REPORT_COUNT = 6;
const MASS_REPORT_SPREAD = { count: 4, programs: 3 };
const MASS_REPORT_WINDOW = DAY;
/** "Reported broken, but others confirmed it working afterwards" needs this many confirmations and a clear majority. */
const CONTRADICTED_MIN_CONFIRMATIONS = 5;
const CONTRADICTED_MIN_WORKING_SHARE = 0.85;
const TIER_TRUST: Record<string, number> = { new: 0.7, returning: 0.9, regular: 1, star: 1.2 };

export type ReviewReport = {
  id: string;
  programSlug: string;
  key: string;
  label?: string;
  eventType: string;
  createdAt: string;
  fit?: string;
  triedVersion?: string;
  ipHash?: string;
};

export type ReviewKey = {
  programSlug: string;
  programTitle: string;
  storageKey: string;
  keyId?: string;
  label: string;
  status: CDKeyStatus;
  version?: string;
  validUntil?: string;
  latestVersion?: string;
};

export type ReviewVisitor = { tier?: string; spammer?: boolean };

/** Why a key's status should change, for the dialog's chips (each has a matching sentence in `reasons`). */
export type KeySignal =
  | { kind: "broken-listed"; share: number; reporters: number }
  | { kind: "recent-failures"; count: number }
  | { kind: "fails-latest"; reporters: number; version: string }
  | { kind: "past-valid-until"; date: string }
  | { kind: "works-again"; share: number; reporters: number }
  | { kind: "still-working"; reporters: number };

/** Why a report looks doubtful, for the dialog's chips. */
export type ReportFlag =
  | { kind: "spammer" }
  | { kind: "mass-reporter"; count: number; programs: number }
  | { kind: "contradicted"; confirmations: number }
  | { kind: "impossible-version"; tried: string; latest: string };

export type KeySuggestion = {
  programSlug: string;
  programTitle: string;
  storageKey: string;
  keyId?: string;
  label: string;
  status: CDKeyStatus;
  suggested: CDKeyStatus;
  confidence: "high" | "medium";
  reasons: string[];
  signals: KeySignal[];
  counts: { working: number; failedListed: number; failedLatest: number; reporters: number };
  keyVersion?: string;
  latestVersion?: string;
  lastReportAt?: string;
};

export type DoubtfulReport = {
  id: string;
  programSlug: string;
  programTitle: string;
  storageKey: string;
  label: string;
  eventType: string;
  createdAt: string;
  triedVersion?: string;
  fit?: string;
  ipHash?: string;
  visitorTier?: string;
  reasons: string[];
  flags: ReportFlag[];
};

export type KeyReview = { keys: KeySuggestion[]; reports: DoubtfulReport[]; windowDays: number };

const isNegative = (r: ReviewReport) =>
  r.eventType === "report_key_expired" || r.eventType === "report_key_limit_reached";
const tenths = (version?: string) => {
  const parsed = version ? parseListedVersionForCompare(version) : null;
  return parsed ? shortVersionToTenths(parsed) : null;
};
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const brokenStatus = (expiredWeight: number, limitWeight: number): CDKeyStatus =>
  limitWeight > expiredWeight ? "limit" : "expired";

/**
 * Visitors who reported many keys broken within a day (or several across different programs). Trying a few keys of
 * one program and finding them used up is normal; reporting keys of many programs broken in a day is not.
 */
function massReporters(reports: ReviewReport[]): Map<string, { count: number; programs: number }> {
  const byVisitor = new Map<string, Array<{ at: number; program: string }>>();
  for (const r of reports) {
    if (!r.ipHash || !isNegative(r)) continue;
    byVisitor.set(r.ipHash, [
      ...(byVisitor.get(r.ipHash) ?? []),
      { at: Date.parse(r.createdAt), program: r.programSlug }
    ]);
  }
  const result = new Map<string, { count: number; programs: number }>();
  for (const [visitor, events] of byVisitor) {
    events.sort((a, b) => a.at - b.at);
    for (let i = 0, j = 0; j < events.length; j++) {
      while (events[j].at - events[i].at > MASS_REPORT_WINDOW) i++;
      const window = events.slice(i, j + 1);
      const programs = new Set(window.map(e => e.program)).size;
      if (
        window.length >= MASS_REPORT_COUNT ||
        (window.length >= MASS_REPORT_SPREAD.count && programs >= MASS_REPORT_SPREAD.programs)
      ) {
        result.set(visitor, { count: window.length, programs });
        break;
      }
    }
  }
  return result;
}

export function reviewKeyReports(
  reports: ReviewReport[],
  keys: ReviewKey[],
  visitors: Map<string, ReviewVisitor>,
  now = Date.now()
): KeyReview {
  const keyById = new Map(keys.map(k => [`${k.programSlug}:${k.storageKey}`, k]));
  const mass = massReporters(reports);
  const byKey = new Map<string, ReviewReport[]>();
  for (const r of reports) {
    const id = `${r.programSlug}:${r.key}`;
    byKey.set(id, [...(byKey.get(id) ?? []), r]);
  }

  const suggestions: KeySuggestion[] = [];
  const doubtful: DoubtfulReport[] = [];

  for (const [id, keyReports] of byKey) {
    const key = keyById.get(id);
    if (!key) continue; // removed from the program: nothing to update
    keyReports.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    const latest = tenths(key.latestVersion);
    const keyVersion = tenths(key.version);
    const keyBehind = latest != null && keyVersion != null && keyVersion < latest;

    const trust = (r: ReviewReport) => {
      const visitor = r.ipHash ? visitors.get(r.ipHash) : undefined;
      if (visitor?.spammer) return 0;
      const tier = TIER_TRUST[visitor?.tier ?? "new"] ?? 0.7;
      return tier * (r.ipHash && mass.has(r.ipHash) ? 0.5 : 1);
    };
    const weight = (r: ReviewReport) => trust(r) * 0.5 ** ((now - Date.parse(r.createdAt)) / DAY / HALF_LIFE_DAYS);

    const sums = { works: 0, listed: 0, latest: 0, listedExpired: 0, listedLimit: 0, latestExpired: 0, latestLimit: 0 };
    const reporters = {
      works: new Set<string>(),
      listed: new Set<string>(),
      latest: new Set<string>(),
      all: new Set<string>()
    };
    const who = (r: ReviewReport) => r.ipHash ?? r.id;

    for (const r of keyReports) {
      const w = weight(r);
      if (w > 0) reporters.all.add(who(r));
      if (r.eventType === "report_key_working") {
        sums.works += w;
        if (w > 0) reporters.works.add(who(r));
        continue;
      }
      if (!isNegative(r)) continue;
      const expired = r.eventType === "report_key_expired";
      const tried = tenths(r.triedVersion);
      if (r.fit !== "other") {
        sums.listed += w;
        sums[expired ? "listedExpired" : "listedLimit"] += w;
        if (w > 0) reporters.listed.add(who(r));
      } else if (latest == null || (tried != null && tried >= latest)) {
        sums.latest += w;
        sums[expired ? "latestExpired" : "latestLimit"] += w;
        if (w > 0) reporters.latest.add(who(r));
      }
    }

    // --- Does the key's status need to change? -----------------------------------------------------------------
    const counts = {
      working: reporters.works.size,
      failedListed: reporters.listed.size,
      failedLatest: reporters.latest.size,
      reporters: reporters.all.size
    };
    const base = {
      programSlug: key.programSlug,
      programTitle: key.programTitle,
      storageKey: key.storageKey,
      keyId: key.keyId,
      label: key.label,
      status: key.status,
      counts,
      keyVersion: key.version,
      latestVersion: key.latestVersion,
      lastReportAt: keyReports[keyReports.length - 1]?.createdAt
    };
    const recent = keyReports.filter(r => r.fit !== "other" && trust(r) > 0).slice(-MIN_REPORTERS);
    const live = key.status === "active" || key.status === "new";

    let suggestion: KeySuggestion | null = null;
    if (live && key.validUntil && Date.parse(key.validUntil) < now) {
      suggestion = {
        ...base,
        suggested: "expired",
        confidence: "high",
        reasons: [`Its valid-until date passed on ${new Date(key.validUntil).toLocaleDateString("en-GB")}.`],
        signals: [{ kind: "past-valid-until", date: key.validUntil }]
      };
    } else if (live) {
      const reasons: string[] = [];
      const signals: KeySignal[] = [];
      let suggested: CDKeyStatus | null = null;
      let high = false;
      const listedShare = sums.listed / (sums.listed + sums.works || 1);
      const streak = recent.length === MIN_REPORTERS && recent.every(isNegative);
      if (counts.failedListed >= MIN_REPORTERS && (listedShare >= 0.6 || streak)) {
        suggested = brokenStatus(sums.listedExpired, sums.listedLimit);
        reasons.push(
          `${plural(counts.failedListed, "visitor")} report it not working on its listed version` +
            `${key.version ? ` (v${key.version})` : ""}: ${pct(listedShare)} of the weighted reports.`
        );
        signals.push({ kind: "broken-listed", share: listedShare, reporters: counts.failedListed });
        if (streak) {
          reasons.push(`The ${MIN_REPORTERS} most recent reports all say it no longer works.`);
          signals.push({ kind: "recent-failures", count: MIN_REPORTERS });
        }
        high = listedShare >= 0.8 && counts.failedListed >= 5;
      }
      const latestShare = sums.latest / (sums.latest + sums.works || 1);
      if (counts.failedLatest >= MIN_REPORTERS && keyBehind && latestShare >= 0.4) {
        suggested ??= brokenStatus(sums.latestExpired, sums.latestLimit);
        reasons.push(
          `${plural(counts.failedLatest, "visitor")} tried the latest v${key.latestVersion} and it failed; ` +
            `the key is listed for v${key.version}. Most people download the latest version.`
        );
        signals.push({ kind: "fails-latest", reporters: counts.failedLatest, version: key.latestVersion! });
        high ||= counts.failedLatest >= 8 && latestShare >= 0.6;
      }
      if (suggested) {
        if (counts.working) {
          reasons.push(`${plural(counts.working, "visitor")} still reported it working in this period.`);
          signals.push({ kind: "still-working", reporters: counts.working });
        }
        suggestion = { ...base, suggested, confidence: high ? "high" : "medium", reasons, signals };
      }
    } else if (key.status === "expired" || key.status === "limit") {
      const worksShare = sums.works / (sums.works + sums.listed || 1);
      const lastWorking = recent.length === MIN_REPORTERS && recent.every(r => r.eventType === "report_key_working");
      if (counts.working >= MIN_REPORTERS && lastWorking && worksShare >= 0.7) {
        suggestion = {
          ...base,
          suggested: "active",
          confidence: worksShare >= 0.85 && counts.working >= 5 ? "high" : "medium",
          reasons: [
            `It is marked ${key.status === "limit" ? "limit reached" : "expired"}, but ${plural(counts.working, "visitor")} ` +
              `reported it working (${pct(worksShare)} of the weighted reports), including the ${MIN_REPORTERS} most recent.`
          ],
          signals: [{ kind: "works-again", share: worksShare, reporters: counts.working }]
        };
      }
    }
    if (suggestion) suggestions.push(suggestion);

    const overallWorking = sums.works / (sums.works + sums.listed || 1);
    // --- Doubtful reports on this key ------------------------------------------------------------------------
    for (const [i, r] of keyReports.entries()) {
      const reasons: string[] = [];
      const flags: ReportFlag[] = [];
      const visitor = r.ipHash ? visitors.get(r.ipHash) : undefined;
      if (visitor?.spammer) {
        reasons.push("The visitor is flagged as a spammer.");
        flags.push({ kind: "spammer" });
      }
      const massReport = r.ipHash ? mass.get(r.ipHash) : undefined;
      if (massReport && isNegative(r)) {
        reasons.push(
          `The same visitor reported ${massReport.count} keys of ${plural(massReport.programs, "program")} as not working within a day.`
        );
        flags.push({ kind: "mass-reporter", ...massReport });
      }
      const tried = tenths(r.triedVersion);
      if (r.fit === "other" && tried != null && latest != null && tried > latest) {
        reasons.push(
          `Says it tried v${r.triedVersion}, newer than the latest official v${key.latestVersion} (or the recorded latest version is out of date).`
        );
        flags.push({ kind: "impossible-version", tried: r.triedVersion!, latest: key.latestVersion! });
      }
      // Mixed results are normal for shared keys; only an overwhelming working majority makes a failure doubtful.
      if (isNegative(r) && r.fit !== "other") {
        const confirmedAfter = new Set(
          keyReports
            .slice(i + 1)
            .filter(later => later.eventType === "report_key_working" && who(later) !== who(r) && trust(later) > 0)
            .map(who)
        );
        if (
          !suggestion &&
          overallWorking >= CONTRADICTED_MIN_WORKING_SHARE &&
          confirmedAfter.size >= CONTRADICTED_MIN_CONFIRMATIONS
        ) {
          reasons.push(`${plural(confirmedAfter.size, "visitor")} reported it working afterwards.`);
          flags.push({ kind: "contradicted", confirmations: confirmedAfter.size });
        }
      }
      if (reasons.length) {
        doubtful.push({
          id: r.id,
          programSlug: key.programSlug,
          programTitle: key.programTitle,
          storageKey: key.storageKey,
          label: key.label,
          eventType: r.eventType,
          createdAt: r.createdAt,
          triedVersion: r.triedVersion,
          fit: r.fit,
          ipHash: r.ipHash,
          visitorTier: visitor?.tier,
          reasons,
          flags
        });
      }
    }
  }

  suggestions.sort((a, b) =>
    a.confidence !== b.confidence
      ? a.confidence === "high"
        ? -1
        : 1
      : b.counts.failedListed + b.counts.failedLatest - (a.counts.failedListed + a.counts.failedLatest)
  );
  doubtful.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return { keys: suggestions, reports: doubtful, windowDays: REVIEW_WINDOW_DAYS };
}
