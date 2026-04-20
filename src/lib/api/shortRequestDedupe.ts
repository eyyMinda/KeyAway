/** Drop repeat POSTs within this window (double-clicks, duplicate taps, refresh spam). In-memory per process. */
export const SHORT_REQUEST_DEDUPE_WINDOW_MS = 2000;

const lastAcceptedAt = new Map<string, number>();
const PRUNE_AT = 10_000;

/**
 * @returns true if this key was accepted recently — caller should skip the expensive work.
 */
export function isRecentDuplicateRequest(key: string, now = Date.now()): boolean {
  const prev = lastAcceptedAt.get(key);
  if (prev !== undefined && now - prev < SHORT_REQUEST_DEDUPE_WINDOW_MS) {
    return true;
  }
  lastAcceptedAt.set(key, now);

  if (lastAcceptedAt.size > PRUNE_AT) {
    const cutoff = now - SHORT_REQUEST_DEDUPE_WINDOW_MS;
    for (const [k, t] of lastAcceptedAt) {
      if (t < cutoff) lastAcceptedAt.delete(k);
    }
  }

  return false;
}
