/**
 * Central color system: semantic analytics / visitor tiers + re-exports.
 * Canonical scales: `tailwind-palette.json` (repo root; imported by `tailwind.config.ts`).
 * Keep `src/app/globals.css` :root hex in sync when changing palette.
 */

import tailwindPalette from "../../tailwind-palette.json";

export const palette = tailwindPalette.palette;
export const analyticsAccents = tailwindPalette.analyticsAccents;

/** Extra colors for multi-series charts (doughnut fallbacks). */
export const chartSeriesFallback = [
  analyticsAccents.download,
  analyticsAccents.copy,
  analyticsAccents.social,
  analyticsAccents.pageview,
  palette.error[500],
  "#06B6D4",
  "#84CC16",
  "#F97316"
] as const;

/** Per tracking event: chart hex + dot (Tailwind bg-*). */
export const analyticsEvent = {
  copy_cdkey: {
    chartHex: analyticsAccents.copy,
    dotClass: "bg-analytics-copy"
  },
  copy_pro_account: {
    chartHex: analyticsAccents.copy,
    dotClass: "bg-analytics-copy"
  },
  click_activation_link: {
    chartHex: analyticsAccents.copy,
    dotClass: "bg-analytics-copy"
  },
  download_click: {
    chartHex: analyticsAccents.download,
    dotClass: "bg-analytics-download"
  },
  social_click: {
    chartHex: analyticsAccents.social,
    dotClass: "bg-analytics-social"
  },
  page_viewed: {
    chartHex: analyticsAccents.pageview,
    dotClass: "bg-analytics-pageview"
  }
} as const;

export type AnalyticsEventKey = keyof typeof analyticsEvent;

/** Tier / event pill: copy=new, download=returning, social=regular, page view=star. Shared label text. */
export const trackingTagPillTextClass = "text-white";

export const trackingTagTierBackgroundClass = {
  new: "bg-[#67e375]",
  returning: "bg-[#28c8e8]",
  regular: "bg-[#ec561b]",
  star: "bg-[#ff9552]"
} as const;

/** Compact pill row in events tables. */
export const eventTypePillClass: Record<AnalyticsEventKey, string> = {
  copy_cdkey: `${trackingTagTierBackgroundClass.new} ${trackingTagPillTextClass}`,
  copy_pro_account: `${trackingTagTierBackgroundClass.new} ${trackingTagPillTextClass}`,
  click_activation_link: `${trackingTagTierBackgroundClass.new} ${trackingTagPillTextClass}`,
  download_click: `${trackingTagTierBackgroundClass.returning} ${trackingTagPillTextClass}`,
  social_click: `${trackingTagTierBackgroundClass.regular} ${trackingTagPillTextClass}`,
  page_viewed: `${trackingTagTierBackgroundClass.star} ${trackingTagPillTextClass}`
};

/** Not in tier set — saturated enough for white label text. */
export const pageViewNotFoundPillClass = `bg-[#e53935] ${trackingTagPillTextClass}`;

export const pageViewNotFoundDotClass = "bg-analytics-notfound";

/** Visitor tier tags — same bg mapping as events; spammer: deep red for white text. */
export const visitorTierPillClass = {
  new: `${trackingTagTierBackgroundClass.new} ${trackingTagPillTextClass}`,
  returning: `${trackingTagTierBackgroundClass.returning} ${trackingTagPillTextClass}`,
  regular: `${trackingTagTierBackgroundClass.regular} ${trackingTagPillTextClass}`,
  star: `${trackingTagTierBackgroundClass.star} ${trackingTagPillTextClass}`,
  spammer: `bg-[#c62828] ${trackingTagPillTextClass}`
} as const;

export type VisitorTierKey = keyof typeof visitorTierPillClass;

/** Bg-only class for tier legend / analytics table swatch (matches pill fills). */
export function visitorTierSwatchBgClass(tierKey: string): string {
  const k = tierKey.toLowerCase();
  if (k === "spammer") return "bg-[#c62828]";
  if (k in trackingTagTierBackgroundClass) {
    return trackingTagTierBackgroundClass[k as keyof typeof trackingTagTierBackgroundClass];
  }
  return "bg-neutral-400";
}

export function visitorTierBadgeClasses(tier: string | undefined | null, isSpammer: boolean): string {
  const base = "text-xs px-1.5 py-0.5 rounded shrink-0 capitalize font-bold";
  if (isSpammer) return `${base} ${visitorTierPillClass.spammer}`;
  const t = (tier || "new").toLowerCase();
  if (t in visitorTierPillClass && t !== "spammer") {
    return `${base} ${visitorTierPillClass[t as Exclude<VisitorTierKey, "spammer">]}`;
  }
  return `${base} ${visitorTierPillClass.new}`;
}

export function analyticsEventPillClasses(event: string, opts: { isPageViewNotFound?: boolean }): string {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold";
  if (event === "page_viewed" && opts.isPageViewNotFound) {
    return `${base} ${pageViewNotFoundPillClass}`;
  }
  if (event in eventTypePillClass) {
    return `${base} ${eventTypePillClass[event as AnalyticsEventKey]}`;
  }
  return `${base} bg-neutral-700 ${trackingTagPillTextClass}`;
}

export function getAnalyticsEventChartHex(event: string): string {
  if (event in analyticsEvent) return analyticsEvent[event as AnalyticsEventKey].chartHex;
  return analyticsAccents.default;
}

export function getAnalyticsEventDotClass(event: string): string {
  if (event in analyticsEvent) return analyticsEvent[event as AnalyticsEventKey].dotClass;
  return "bg-analytics-default";
}

/** For logger / devtools (inline styles). */
/** Shared admin / marketing class strings (map legacy blue/green to theme `primary` / `success`). */
export const adminChrome = {
  filterPillActive: "bg-primary-500 text-white",
  filterPillIdle: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
  progressBarFill: "bg-primary-500",
  statCardBlue: {
    bg: "bg-primary-500/50",
    text: "text-primary-600",
    border: "border-primary-200"
  },
  statCardGreen: {
    bg: "bg-success-500/50",
    text: "text-success-600",
    border: "border-success-200"
  }
} as const;

/** `ModalSection` panel chrome (replaces raw blue/green Tailwind). */
export const modalSectionStyles = {
  blue: {
    bar: "bg-primary-500",
    background: "bg-linear-to-br from-primary-50 to-indigo-50",
    border: "border-primary-100",
    content: "border-primary-200"
  },
  green: {
    bar: "bg-success-500",
    background: "bg-linear-to-br from-success-50 to-success-100",
    border: "border-success-100",
    content: "border-success-200"
  },
  red: {
    bar: "bg-error-500",
    background: "bg-linear-to-br from-error-50 to-pink-50",
    border: "border-error-100",
    content: "border-error-200"
  },
  purple: {
    bar: "bg-accent-600",
    background: "bg-linear-to-br from-accent-50 to-primary-50",
    border: "border-accent-100",
    content: "border-accent-200"
  },
  gray: {
    bar: "bg-neutral-500",
    background: "bg-linear-to-br from-neutral-50 to-neutral-100",
    border: "border-neutral-100",
    content: "border-neutral-200"
  }
} as const;

/** `AnalyticsCard` icon well by semantic color name. */
export const analyticsCardIconMap = {
  blue: adminChrome.statCardBlue,
  green: adminChrome.statCardGreen,
  purple: { bg: "bg-accent-500/50", text: "text-accent-700", border: "border-accent-200" },
  orange: { bg: "bg-warning-500/50", text: "text-warning-700", border: "border-warning-200" },
  red: { bg: "bg-error-500/50", text: "text-error-700", border: "border-error-200" }
} as const;

export const devConsoleBadge = {
  success: `background-color: ${palette.success[500]}; color: white; font-weight: bold; padding: 6px; border-radius: 4px;`,
  error: `background-color: ${palette.error[500]}; color: white; font-weight: bold; padding: 6px; border-radius: 4px;`,
  info: `background-color: ${analyticsAccents.download}; color: white; font-weight: bold; padding: 6px; border-radius: 4px;`,
  warning: `background-color: ${analyticsAccents.pageview}; color: white; font-weight: bold; padding: 6px; border-radius: 4px;`
} as const;
