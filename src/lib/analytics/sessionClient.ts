"use client";

import type { AnalyticsEvent, KeyReportEvent, TrackEventMeta } from "@/src/types";
import { isAdminSession } from "@/src/lib/admin/isAdminSession";
import {
  SESSION_IDLE_MS,
  SESSION_MAX_EVENTS,
  SESSION_MAX_MS,
  type SessionEntry
} from "@/src/lib/analytics/sessionConstants";
import { classifySessionReferrer } from "@/src/lib/analytics/sessionEntry";

const STORAGE_KEY = "keyaway:session:v1";

type StoredSession = {
  id: string;
  startedAt: number;
  lastEventAt: number;
  eventCount: number;
  docId: number;
  entry?: SessionEntry;
  referrer?: string;
  entrySent: boolean;
};

type QueuedEvent = {
  sessionId: string;
  entry?: SessionEntry;
  referrer?: string;
  event: AnalyticsEvent;
  meta?: TrackEventMeta;
  createdAt: string;
};

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;

function navigationType(): string | undefined {
  if (typeof performance === "undefined") return undefined;
  const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return entry?.type;
}

function wasDiscarded(): boolean {
  return typeof document !== "undefined" && (document as { wasDiscarded?: boolean }).wasDiscarded === true;
}

/** Classify only when a new document loads. Idle rotation inside the same document is a restored tab. */
export function classifyClientSessionEntry(sameDocument: boolean): { entry: SessionEntry; referrer?: string } {
  if (sameDocument || wasDiscarded()) return { entry: "restore" };
  const nav = navigationType();
  if (nav === "reload" || nav === "back_forward") return { entry: "restore" };
  const referrer = typeof document !== "undefined" ? document.referrer : "";
  return classifySessionReferrer(referrer);
}

function readStored(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.id || typeof parsed.startedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(session: StoredSession): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // private mode
  }
}

function newSession(docId: number, sameDocument: boolean): StoredSession {
  const classified = classifyClientSessionEntry(sameDocument);
  return {
    id: crypto.randomUUID(),
    startedAt: Date.now(),
    lastEventAt: Date.now(),
    eventCount: 0,
    docId,
    entry: classified.entry,
    referrer: classified.referrer,
    entrySent: false
  };
}

function ensureSession(): StoredSession {
  const docId = typeof performance !== "undefined" ? performance.timeOrigin : 0;
  const existing = readStored();
  const now = Date.now();
  if (!existing) {
    const created = newSession(docId, false);
    writeStored(created);
    return created;
  }
  const idle = now - existing.lastEventAt > SESSION_IDLE_MS;
  const expired = now - existing.startedAt > SESSION_MAX_MS;
  const full = existing.eventCount >= SESSION_MAX_EVENTS;
  if (idle || expired || full) {
    const created = newSession(docId, existing.docId === docId);
    writeStored(created);
    return created;
  }
  if (existing.docId !== docId) {
    existing.docId = docId;
    writeStored(existing);
  }
  return existing;
}

/** Current visit id plus the landing source captured for this document. */
export function getTrackingSessionMeta(): { sessionId: string; sessionEntry?: SessionEntry; referrer?: string } {
  if (typeof window === "undefined") return { sessionId: "" };
  const session = ensureSession();
  return { sessionId: session.id, sessionEntry: session.entry, referrer: session.referrer };
}

/** Current visit id. Creates one if this tab does not have an open session. */
export function getTrackingSessionId(): string {
  return getTrackingSessionMeta().sessionId;
}

function bindFlushListeners(): void {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;
  const flushHidden = () => {
    if (document.visibilityState === "hidden") void flushTrackingSession(true);
  };
  window.addEventListener("pagehide", () => void flushTrackingSession(true));
  document.addEventListener("visibilitychange", flushHidden);
}

function scheduleFlush(delayMs: number): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushTrackingSession(false);
  }, delayMs);
}

export function enqueueAnalyticsEvent(event: AnalyticsEvent | KeyReportEvent, meta?: TrackEventMeta): void {
  if (typeof window === "undefined") return;
  if (event.startsWith("report_")) return;
  bindFlushListeners();
  const session = ensureSession();
  const sendEntry = !session.entrySent;
  session.lastEventAt = Date.now();
  session.eventCount += 1;
  if (sendEntry) session.entrySent = true;
  writeStored(session);
  queue.push({
    sessionId: session.id,
    ...(sendEntry ? { entry: session.entry, referrer: session.referrer } : {}),
    event: event as AnalyticsEvent,
    meta,
    createdAt: new Date().toISOString()
  });
  if (event === "page_viewed" || queue.length >= 8) scheduleFlush(0);
  else scheduleFlush(4000);
}

export async function flushTrackingSession(useBeacon: boolean): Promise<void> {
  if (typeof window === "undefined" || queue.length === 0) return;
  if (await isAdminSession()) {
    queue = [];
    return;
  }

  const events = queue.splice(0, 30);
  const sessionId = events[0]?.sessionId;
  const batch = events.filter(e => e.sessionId === sessionId);
  const rest = events.filter(e => e.sessionId !== sessionId);
  if (rest.length) queue = [...rest, ...queue];
  const entryEvent = batch.find(e => e.entry);
  const body = {
    sessionId,
    ...(entryEvent
      ? {
          entry: entryEvent.entry,
          referrer: entryEvent.referrer,
          landingPath: batch.find(e => e.meta?.path)?.meta?.path
        }
      : {}),
    events: batch.map(e => ({
      event: e.event,
      createdAt: e.createdAt,
      meta: e.meta
    }))
  };

  try {
    if (useBeacon && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/v1/analytics/session", blob);
      if (!ok) queue = [...batch, ...queue];
      return;
    }

    const res = await fetch("/api/v1/analytics/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true
    });
    if (!res.ok) {
      queue = [...batch, ...queue];
      return;
    }
    const json = (await res.json().catch(() => null)) as { data?: { sessionId?: string; rotated?: boolean } } | null;
    const nextId = json?.data?.sessionId;
    if (json?.data?.rotated && nextId && sessionId && nextId !== sessionId) {
      const stored = readStored();
      if (stored && stored.id === sessionId) {
        stored.id = nextId;
        stored.entrySent = true;
        writeStored(stored);
      }
    }
  } catch {
    queue = [...batch, ...queue];
  }
}
