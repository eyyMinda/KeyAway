import { buildChangelogHref } from "@/src/lib/changelog/changelogPageUtils";
import { buildUpdatesHref } from "@/src/lib/updates/updatesPageUtils";

export type FeedKind = "changelog" | "updates";

/** Scroll target for month-filter navigation (below hero + cross-link bar). */
export const FEED_SECTION_ID = "feed";

export function scrollToFeedSection() {
  requestAnimationFrame(() => {
    document.getElementById(FEED_SECTION_ID)?.scrollIntoView({ block: "start" });
  });
}

export function buildFeedMonthHref(feed: FeedKind, month?: string, limit?: number): string {
  if (feed === "changelog") {
    return buildChangelogHref(month, limit);
  }
  return buildUpdatesHref(month, limit);
}
