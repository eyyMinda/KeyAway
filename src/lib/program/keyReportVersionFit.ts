import type { ReportData } from "@/src/types/program";
import type { KeyReportEvent } from "@/src/types/tracking";
import {
  formatVersionLabelDisplay,
  mergeUniqueVersionLabels,
  normalizeTriedVersionForStorage,
  versionLabelCanonicalKey,
  isValidTriedVersionInput,
  isOtherTriedVersionNewerThanListed
} from "@/src/lib/program/versionFitLabel";

export type TriedVersionFit = "listed" | "other";

const NEGATIVE_EVENTS = new Set<KeyReportEvent>(["report_key_expired", "report_key_limit_reached"]);
const MAX_VERSION_LEN = 40;

export function emptyReportData(): ReportData {
  return { working: 0, expired: 0, limit_reached: 0, otherVersion: 0, otherVersionLabels: [] };
}

export function isNegativeKeyReport(event: string): boolean {
  return NEGATIVE_EVENTS.has(event as KeyReportEvent);
}

/** Legacy reports (no fit field) count on the bar. `other` does not. */
export function countsInProgressBar(eventType: string, triedVersionFit?: string | null): boolean {
  if (eventType === "report_key_working") return true;
  if (!isNegativeKeyReport(eventType)) return false;
  return triedVersionFit !== "other";
}

export function applyKeyReportEvent(
  data: ReportData,
  eventType: string,
  triedVersionFit?: string | null,
  triedVersion?: string | null
): ReportData {
  if (eventType === "report_key_working") return { ...data, working: data.working + 1 };
  if (!isNegativeKeyReport(eventType)) return data;
  if (triedVersionFit === "other") {
    const raw = typeof triedVersion === "string" ? triedVersion.trim() : "";
    const display = raw ? formatVersionLabelDisplay(raw) : "";
    const key = raw ? versionLabelCanonicalKey(raw) : null;
    const hasKey =
      key &&
      data.otherVersionLabels.some(existing => versionLabelCanonicalKey(existing) === key);
    const otherVersionLabels =
      display && key && !hasKey ? [...data.otherVersionLabels, display] : data.otherVersionLabels;
    return { ...data, otherVersion: data.otherVersion + 1, otherVersionLabels };
  }
  if (eventType === "report_key_expired") return { ...data, expired: data.expired + 1 };
  return { ...data, limit_reached: data.limit_reached + 1 };
}

export function formatOtherVersionHint(versions: string[], listedVersion?: string): string {
  const labels = mergeUniqueVersionLabels(versions);
  if (!labels.length) return "";
  if (labels.length === 1) {
    return listedVersion
      ? `Other visitors reported this key not working on version ${labels[0]} (listed: ${listedVersion}).`
      : `Other visitors reported this key not working on version ${labels[0]}.`;
  }
  return `Other visitors reported this key not working on versions: ${labels.join(", ")}.`;
}

export interface VersionFitFields {
  triedVersionFit?: TriedVersionFit;
  listedVersion?: string;
  triedVersion?: string;
}

export function parseVersionFitInput(
  event: string,
  raw: Record<string, unknown>
): { ok: true; fields: VersionFitFields } | { ok: false; error: string } {
  if (!isNegativeKeyReport(event)) return { ok: true, fields: {} };

  const fitRaw = typeof raw.triedVersionFit === "string" ? raw.triedVersionFit.trim() : "";
  if (fitRaw !== "listed" && fitRaw !== "other") {
    return { ok: false, error: "triedVersionFit must be listed or other for expired/limit reports" };
  }

  const listedVersion =
    typeof raw.listedVersion === "string" && raw.listedVersion.trim()
      ? raw.listedVersion.trim().slice(0, MAX_VERSION_LEN)
      : undefined;

  const fields: VersionFitFields = { triedVersionFit: fitRaw, ...(listedVersion ? { listedVersion } : {}) };

  if (fitRaw === "other") {
    const tried =
      typeof raw.triedVersion === "string" && raw.triedVersion.trim()
        ? raw.triedVersion.trim().slice(0, MAX_VERSION_LEN)
        : "";
    if (!tried) return { ok: false, error: "triedVersion required when reporting a different version" };
    if (!isValidTriedVersionInput(tried)) {
      return { ok: false, error: "triedVersion must match format 16 or 16.0 (up to 2 digits, optional . and 1 digit)" };
    }
    const normalized = normalizeTriedVersionForStorage(tried);
    if (!normalized) return { ok: false, error: "Invalid triedVersion" };
    if (listedVersion && !isOtherTriedVersionNewerThanListed(tried, listedVersion)) {
      return {
        ok: false,
        error: "triedVersion must be at least 0.1 newer than the listed key version; use listed or older if not"
      };
    }
    fields.triedVersion = normalized;
  }

  return { ok: true, fields };
}
