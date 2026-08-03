/** Default visible rows when browsing the full feed (no sidebar month filter). */
export const UPDATES_FEED_DEFAULT_LIMIT = 20;
export const UPDATES_FEED_LIMIT_INCREMENT = 20;

export const CHANGELOG_FEED_DEFAULT_LIMIT = 5;
export const CHANGELOG_FEED_LIMIT_INCREMENT = 5;

export function resolveFeedLimit(raw: string | undefined, defaultLimit: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < defaultLimit) return defaultLimit;
  return parsed;
}

export function applyFeedLimit<T>(
  items: T[],
  limit: number,
  /** When true (e.g. sidebar month selected), show every item in the filtered set. */
  unlimited: boolean
): { visible: T[]; hasMore: boolean; total: number } {
  const total = items.length;
  if (unlimited) {
    return { visible: items, hasMore: false, total };
  }
  const visible = items.slice(0, limit);
  return { visible, hasMore: total > limit, total };
}

export function nextFeedLimit(currentLimit: number, increment: number, total: number): number {
  return Math.min(currentLimit + increment, total);
}
