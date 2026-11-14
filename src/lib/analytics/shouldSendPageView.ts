import { isLikelyBotUserAgent } from "@/src/lib/api/botUserAgent";

/** Client-only: skip obvious automation before calling /api/v1/analytics/track. */
export function shouldSkipClientPageView(): boolean {
  if (typeof navigator === "undefined") return true;
  if (navigator.webdriver) return true;
  if (isLikelyBotUserAgent(navigator.userAgent)) return true;
  return false;
}

const ENGAGEMENT_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart", "click"] as const;

/**
 * Human engagement or dwell: link-preview bots rarely wait or interact. Dwell only counts while the page is visible,
 * so a tab loaded in the background (or a page rendered off-screen) is not a view until someone actually sees it.
 */
const PAGE_VIEW_DWELL_MS = 8_000;

/**
 * Resolves when we should send a page_viewed (engagement, dwell timeout, or already activated).
 * Caller should abort tracking if this resolves false (only when cancelled).
 */
export function waitForPageViewEngagement(signal: AbortSignal): Promise<void> {
  if (shouldSkipClientPageView()) {
    return Promise.reject(new DOMException("skipped", "AbortError"));
  }

  if (
    typeof navigator !== "undefined" &&
    "userActivation" in navigator &&
    (navigator as Navigator & { userActivation?: { hasBeenActive?: boolean } }).userActivation?.hasBeenActive
  ) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("aborted", "AbortError"));
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new DOMException("aborted", "AbortError"));
    };

    const onEngage = () => finish();

    // Visible time left before the dwell counts as a view; paused while the page is hidden.
    let remaining = PAGE_VIEW_DWELL_MS;
    let visibleSince = 0;
    let dwellTimer: ReturnType<typeof setTimeout> | undefined;
    const resumeDwell = () => {
      visibleSince = Date.now();
      dwellTimer = setTimeout(finish, remaining);
    };
    const pauseDwell = () => {
      clearTimeout(dwellTimer);
      dwellTimer = undefined;
      remaining = Math.max(0, remaining - (Date.now() - visibleSince));
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (!dwellTimer) resumeDwell();
      } else if (dwellTimer) pauseDwell();
    };

    const cleanup = () => {
      signal.removeEventListener("abort", onAbort);
      clearTimeout(dwellTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      for (const ev of ENGAGEMENT_EVENTS) {
        document.removeEventListener(ev, onEngage);
      }
    };

    signal.addEventListener("abort", onAbort);
    for (const ev of ENGAGEMENT_EVENTS) {
      document.addEventListener(ev, onEngage, { once: true, passive: true });
    }

    document.addEventListener("visibilitychange", onVisibility);
    if (document.visibilityState === "visible") resumeDwell();
  });
}
