import { isOwnSiteHost, isSessionEntry, type SessionEntry } from "@/src/lib/analytics/sessionConstants";

/** Landing source for a new session. Same-site referrers are internal navigation, not acquisition. */
export function classifySessionReferrer(referrer: string | undefined | null): {
  entry: SessionEntry;
  referrer?: string;
} {
  const raw = referrer?.trim();
  if (!raw) return { entry: "direct" };
  try {
    const url = new URL(raw);
    if (isOwnSiteHost(url.hostname)) return { entry: "internal" };
    return { entry: "external", referrer: url.href };
  } catch {
    return { entry: "direct" };
  }
}

export function sessionSourceLabel(entry: string | undefined, referrer?: string): string {
  if (entry === "direct") return "Direct";
  if (entry === "internal") return "Internal navigation";
  if (entry === "restore") return "Restored tab";
  if (entry === "external") {
    const classified = classifySessionReferrer(referrer);
    if (classified.entry === "external" && classified.referrer) {
      try {
        const host = new URL(classified.referrer).hostname.replace(/^www\./, "");
        return host || "External";
      } catch {
        return "External";
      }
    }
    return "External";
  }
  if (isSessionEntry(entry)) return entry;
  return "Direct";
}
