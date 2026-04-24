import type { Notification } from "@/src/types/notifications";

const STORAGE_KEY = "keyaway.notifications.v1";
const TTL_MS = 30 * 60 * 1000;
/** Bump when notification list semantics change (e.g. merged new program + keys). */
const CACHE_SCHEMA = 3;

type CachedPayload = { at: number; notifications: Notification[]; schema?: number };

export function readNotificationsFromClientCache(): Notification[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    if (
      typeof parsed?.at !== "number" ||
      !Array.isArray(parsed.notifications) ||
      Date.now() - parsed.at > TTL_MS ||
      parsed.schema !== CACHE_SCHEMA
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.notifications;
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function writeNotificationsToClientCache(notifications: Notification[]): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedPayload = { at: Date.now(), notifications, schema: CACHE_SCHEMA };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}
