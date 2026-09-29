import { MINUTE_MS, HOUR_MS } from "@/src/lib/time";

/** Idle gap before a new visit starts. Matches GA4's default session timeout. */
export const SESSION_IDLE_MS = 30 * MINUTE_MS;

/** Hard cap so a tab left open cannot grow one document all day. */
export const SESSION_MAX_MS = 2 * HOUR_MS;

export const SESSION_MAX_EVENTS = 100;

/** Closed sessions per `trackingSessionBundle` document. */
export const SESSION_BUNDLE_CAPACITY = 800;

export const SESSION_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SessionEntry = "direct" | "external" | "internal" | "restore";

export const SESSION_ENTRY_LABEL: Record<SessionEntry, string> = {
  direct: "Direct",
  external: "External",
  internal: "Internal navigation",
  restore: "Restored tab"
};

export function isSessionEntry(value: string | undefined): value is SessionEntry {
  return value === "direct" || value === "external" || value === "internal" || value === "restore";
}

export function trackingSessionDocumentId(sessionId: string): string {
  return `trackingSession.${sessionId}`;
}

export function isOwnSiteHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/^www\./, "");
  return host === "keyaway.app" || host === "localhost" || host === "127.0.0.1";
}

/** Key report, comment, key suggestion, or contact form. */
export function isContributionEvent(event: string): boolean {
  return (
    event.startsWith("report_") ||
    event === "comment" ||
    event === "comment_reply" ||
    event === "key_suggestion" ||
    event === "contact"
  );
}
