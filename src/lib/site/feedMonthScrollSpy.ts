/** DOM attribute on the first block of each month section in the feed. */
export const FEED_MONTH_MARKER_ATTR = "data-feed-month";

/** Sidebar month link marker — used to scroll active item into view. */
export const FEED_SIDEBAR_MONTH_ATTR = "data-sidebar-month";

/** Match sticky sidebar (`top-24`) + a little breathing room. */
export const FEED_SCROLL_SPY_OFFSET_PX = 120;

/**
 * Pick the month section the reader is currently in.
 *
 * Primary rule (dense feeds): the last month whose top edge crossed the activation line —
 * standard TOC / scroll-spy behavior.
 *
 * Fallback (top of page, multiple months visible): topmost month section intersecting the viewport.
 */
export function resolveActiveFeedMonth(elements: HTMLElement[], activationLinePx: number): string | null {
  if (elements.length === 0) return null;

  let crossed: string | null = null;

  for (const el of elements) {
    const key = el.getAttribute(FEED_MONTH_MARKER_ATTR);
    if (!key) continue;
    if (el.getBoundingClientRect().top <= activationLinePx) {
      crossed = key;
    }
  }

  if (crossed) return crossed;

  let topmost: { key: string; top: number } | null = null;

  for (const el of elements) {
    const key = el.getAttribute(FEED_MONTH_MARKER_ATTR);
    if (!key) continue;

    const rect = el.getBoundingClientRect();
    if (rect.bottom <= activationLinePx || rect.top >= window.innerHeight) continue;

    if (!topmost || rect.top < topmost.top) {
      topmost = { key, top: rect.top };
    }
  }

  return topmost?.key ?? null;
}

export function queryFeedMonthMarkers(root: ParentNode = document): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(`[${FEED_MONTH_MARKER_ATTR}]`)];
}
