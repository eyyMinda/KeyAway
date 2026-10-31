/** @fileoverview Series for the admin activity charts: what each stack splits into, with fixed colors per entity. */
import type { AnalyticsTimeline } from "@/src/lib/api/adminEventsListCache";

export type ChartSeries = { key: string; label: string; color: string };

/** Slot order is the colorblind-safe order from `globals.css`, so keep neighbours in sequence. */
export const VISITOR_TIER_SERIES: ChartSeries[] = [
  { key: "new", label: "New", color: "var(--viz-1)" },
  { key: "returning", label: "Returning", color: "var(--viz-2)" },
  { key: "regular", label: "Regular", color: "var(--viz-3)" },
  { key: "star", label: "Star", color: "var(--viz-4)" }
];

/** Swatches for tier rows elsewhere on the page, so a tier is one color everywhere on it. */
export const VISITOR_TIER_SWATCH: Record<string, string> = {
  new: "bg-(--viz-1)",
  returning: "bg-(--viz-2)",
  regular: "bg-(--viz-3)",
  star: "bg-(--viz-4)"
};

export const PAGE_TYPE_SERIES: ChartSeries[] = [
  { key: "program", label: "Program pages", color: "var(--viz-1)" },
  { key: "home", label: "Homepage", color: "var(--viz-2)" },
  { key: "catalog", label: "All programs", color: "var(--viz-3)" },
  { key: "vendor", label: "Vendor pages", color: "var(--viz-4)" },
  { key: "other", label: "Other pages", color: "var(--viz-5)" }
];

export const ACTION_SERIES: ChartSeries[] = [
  { key: "copy_cdkey", label: "Key copies", color: "var(--viz-1)" },
  { key: "download_click", label: "Downloads", color: "var(--viz-2)" },
  { key: "click_activation_link", label: "Activation links", color: "var(--viz-3)" },
  { key: "copy_pro_account", label: "Account copies", color: "var(--viz-4)" },
  { key: "affiliate_click", label: "Affiliate clicks", color: "var(--viz-5)" },
  { key: "social_click", label: "Social clicks", color: "var(--viz-6)" },
  { key: "promo_click", label: "Promotion clicks", color: "var(--viz-7)" }
];

export const PROMO_PLACEMENT_SERIES: ChartSeries[] = [
  { key: "banner", label: "Site banner", color: "var(--viz-1)" },
  { key: "program", label: "Program card", color: "var(--viz-2)" },
  { key: "bell", label: "Notification bell", color: "var(--viz-3)" },
  { key: "home", label: "Homepage badge", color: "var(--viz-4)" }
];

/** Page views are the denominator; contributions have their own admin pages. */
const NON_ACTIONS = new Set(["page_viewed", "comment", "comment_reply", "key_suggestion", "contact"]);

/** Total action events (clicks besides page views). */
export function countActions(totals: Record<string, number>): number {
  return Object.entries(totals).reduce((sum, [event, n]) => (NON_ACTIONS.has(event) ? sum : sum + n), 0);
}

export function formatBucket(iso: string, bucket: AnalyticsTimeline["bucket"], withDate = false): string {
  const d = new Date(iso);
  if (bucket === "hour") {
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return withDate ? `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${time}` : time;
  }
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return bucket === "week" && withDate ? `Week of ${date}` : date;
}
