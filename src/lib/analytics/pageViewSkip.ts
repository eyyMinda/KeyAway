/** @fileoverview SessionStorage keys written by NotFoundTracker; PageViewTracker reads and clears per navigation. */
export const PAGE_VIEW_SKIP_STORAGE_PREFIX = "keyaway_skip_pv:";

export function pageViewSkipKey(pathname: string): string {
  return `${PAGE_VIEW_SKIP_STORAGE_PREFIX}${pathname}`;
}
