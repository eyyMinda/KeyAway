/** @fileoverview Pure helpers for the admin key reports page: group raw reports by key, patch rows, suggest statuses. */
import { getKeyData, normalizeKey } from "@/src/lib/keyHashing";
import {
  getActivationEntryDisplayLabel,
  isAccountFlow,
  isKeyLikeFlow,
  isLinkAccountFlow,
  normalizeProgramFlow
} from "@/src/lib/program/activationEntry";
import { applyKeyReportEvent, emptyReportData } from "@/src/lib/program/keyReportVersionFit";
import { mergeUniqueVersionLabels, parseListedVersionForCompare, shortVersionToTenths } from "@/src/lib/program/versionFitLabel";
import type { KeyReport } from "@/src/types/admin";
import type { CDKey, CDKeyStatus, Program, ProgramFlow } from "@/src/types/program";
import type { KeyReportEvent } from "@/src/types";

export type KeyReportProgram = Pick<Program, "_id" | "title" | "slug" | "programFlow" | "cdKeys"> & {
  latestOfficialVersion?: string;
};
export type KeyReportRow = KeyReport["reports"][number];
export type KeyReportRowUpdate = Pick<KeyReportRow, "_id" | "eventType" | "listedVersion" | "triedVersion"> & {
  triedVersionFit?: string;
};

/** Reports needed before a key's status is worth second-guessing. */
const MIN_REPORTS_FOR_SUGGESTION = 10;
const SUGGEST_BROKEN_MAX_WORKING = 0.2;
const SUGGEST_WORKING_MIN_WORKING = 0.8;

export const keyReportId = (r: Pick<KeyReport, "programSlug" | "storageKey">) => `${r.programSlug}:${r.storageKey}`;

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/** Report rows newest first, keyed by program + reported key. Raw events must already be newest first. */
export function buildKeyReports(events: Array<Record<string, unknown>>, programs: KeyReportProgram[]): KeyReport[] {
  const programBySlug = new Map(programs.map(p => [p.slug?.current, p]));
  const keysByProgram = new Map<string, Map<string, CDKey>>();
  const groups = new Map<string, KeyReport>();

  const keyLookup = (slug: string, program?: KeyReportProgram) => {
    const cached = keysByProgram.get(slug);
    if (cached) return cached;
    const flow = normalizeProgramFlow(program?.programFlow);
    const lookup = new Map<string, CDKey>();
    for (const key of program?.cdKeys ?? []) {
      const hash = getKeyData({ ...(key as CDKey), programFlow: flow }, flow)?.hash;
      if (hash) lookup.set(hash, key as CDKey);
    }
    keysByProgram.set(slug, lookup);
    return lookup;
  };

  for (const event of events) {
    const programSlug = text(event.programSlug) || "unknown";
    const storageKey = text(event.key) || "unknown";
    const createdAt = event.createdAt as string;
    const id = keyReportId({ programSlug, storageKey });

    let group = groups.get(id);
    if (!group) {
      const program = programBySlug.get(programSlug);
      const flow = normalizeProgramFlow(program?.programFlow);
      const row = keyLookup(programSlug, program).get(storageKey) ?? null;
      const username = isAccountFlow(flow) ? text(row?.username) : "";
      const password = isAccountFlow(flow) ? text(row?.password) : "";
      const cdKey = isKeyLikeFlow(flow) ? text(row?.key) : "";

      group = {
        key: row ? getActivationEntryDisplayLabel(row, flow) : text(event.label) || "Unknown",
        storageKey,
        programFlow: flow,
        ...(username ? { resolvedUsername: username } : {}),
        ...(password ? { resolvedPassword: password } : {}),
        ...(cdKey ? { resolvedCdKey: cdKey } : {}),
        ...(row?._key ? { keyId: row._key } : {}),
        ...(text(row?.version) ? { keyVersion: text(row?.version) } : {}),
        ...(text(program?.latestOfficialVersion) ? { latestVersion: text(program?.latestOfficialVersion) } : {}),
        programSlug,
        ...(program?._id ? { programId: program._id } : {}),
        programTitle: program?.title || "Unknown Program",
        reportCount: 0,
        firstReported: createdAt,
        lastReported: createdAt,
        status: row?.status || "active",
        validFrom: row?.validFrom,
        validTo: row?.validUntil,
        reportData: emptyReportData(),
        reports: []
      };
      groups.set(id, group);
    }

    const triedVersionFit = text(event.triedVersionFit);
    group.reports.push({
      _id: text(event._id),
      ipHash: text(event.ipHash) || undefined,
      referrer: text(event.referrer) || undefined,
      createdAt,
      country: text(event.country) || "Unknown",
      city: text(event.city) || "Unknown",
      eventType: event.eventType as KeyReportEvent,
      listedVersion: text(event.listedVersion) || undefined,
      triedVersionFit: triedVersionFit === "listed" || triedVersionFit === "other" ? triedVersionFit : undefined,
      triedVersion: text(event.triedVersion) || undefined
    });
  }

  return [...groups.values()].map(summarizeReport);
}

/** Recomputes a key's counts and date range from its rows. */
export function summarizeReport(report: KeyReport): KeyReport {
  let reportData = emptyReportData();
  let firstReported = report.firstReported;
  let lastReported = report.lastReported;
  for (const row of report.reports) {
    reportData = applyKeyReportEvent(reportData, row.eventType, row.triedVersionFit, row.triedVersion);
    if (row.createdAt < firstReported) firstReported = row.createdAt;
    if (row.createdAt > lastReported) lastReported = row.createdAt;
  }
  return {
    ...report,
    reportCount: report.reports.length,
    firstReported,
    lastReported,
    reportData: { ...reportData, otherVersionLabels: mergeUniqueVersionLabels(reportData.otherVersionLabels) }
  };
}

/** Merges server-updated rows into a key. Untouched rows keep their identity, so only changed rows re-render. */
export function patchReportRows(report: KeyReport, updates: KeyReportRowUpdate[]): KeyReport {
  const byId = new Map(updates.map(u => [u._id, u]));
  const reports = report.reports.map((row): KeyReportRow => {
    const update = byId.get(row._id);
    if (!update) return row;
    const fit = update.triedVersionFit;
    return {
      ...row,
      eventType: update.eventType,
      listedVersion: update.listedVersion,
      triedVersionFit: fit === "listed" || fit === "other" ? fit : undefined,
      triedVersion: update.triedVersion
    };
  });
  return summarizeReport({ ...report, reports });
}

/** Status the reports point to when it differs from the key's current one, or null when there is nothing to do. */
export function suggestedKeyStatus(report: KeyReport): CDKeyStatus | null {
  const { working, expired, limit_reached } = report.reportData;
  const total = working + expired + limit_reached;
  if (total < MIN_REPORTS_FOR_SUGGESTION) return null;
  const ratio = working / total;
  if (ratio <= SUGGEST_BROKEN_MAX_WORKING) {
    const broken: CDKeyStatus = expired >= limit_reached ? "expired" : "limit";
    return report.status === broken ? null : broken;
  }
  if (ratio >= SUGGEST_WORKING_MIN_WORKING && (report.status === "expired" || report.status === "limit")) return "active";
  return null;
}

/** True when the key is listed for an older version than the program's latest official one. */
export function isKeyVersionBehind(report: Pick<KeyReport, "keyVersion" | "latestVersion">): boolean {
  if (!report.keyVersion || !report.latestVersion) return false;
  const listed = parseListedVersionForCompare(report.keyVersion);
  const latest = parseListedVersionForCompare(report.latestVersion);
  return Boolean(listed && latest && shortVersionToTenths(listed) < shortVersionToTenths(latest));
}

/** `?key=` filter: row storage is plaintext CD key, lowercase username, or link digest — not CD-key SHA. */
export function keyQueryMatchesReport(flow: ProgramFlow, report: Pick<KeyReport, "storageKey" | "key">, raw: string): boolean {
  const r = raw.trim();
  const sk = report.storageKey.trim();
  if (!r || !sk) return false;
  if (sk === r || sk.toLowerCase() === r.toLowerCase()) return true;
  if (isKeyLikeFlow(flow) && normalizeKey(sk) === normalizeKey(r)) return true;
  const dk = (report.key ?? "").trim();
  if (!dk || dk === "Unknown Key" || dk === "Unknown") return false;
  if (isKeyLikeFlow(flow) && normalizeKey(dk) === normalizeKey(r)) return true;
  return (isAccountFlow(flow) || isLinkAccountFlow(flow)) && dk.toLowerCase() === r.toLowerCase();
}
