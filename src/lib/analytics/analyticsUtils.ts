/** @fileoverview Analytics helpers: date ranges, aggregates, chart/table transforms, referrer display, event labels. */
import { AnalyticsEventData } from "@/src/types";
import { resolveEffectiveReferrer } from "@/src/lib/analytics/referrerResolve";
import { isPageViewNotFoundRow } from "@/src/lib/analytics/pageViewDisplay";

function referrerBucketHostname(hostname: string): string {
  const h = hostname.trim().toLowerCase();
  return h.startsWith("www.") ? h.slice(4) : h;
}

// Date range helpers (admin time filter → GROQ since/until)
export function getDateRange(
  period: string,
  customDateRange?: { start: string; end: string }
): { since: string; until: string } {
  const now = new Date();
  const until = now.toISOString();
  let since: string;
  switch (period) {
    case "1h":
      since = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      break;
    case "24h":
      since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      break;
    case "7d":
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case "30d":
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case "90d":
      since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case "custom":
      if (customDateRange?.start && customDateRange?.end) {
        since = new Date(customDateRange.start).toISOString();
        return { since, until: new Date(customDateRange.end + "T23:59:59.999Z").toISOString() };
      }
      since = new Date("1970-01-01").toISOString();
      break;
    default:
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }
  return { since, until };
}

export function getDateFromPeriod(period: string, customDateRange?: { start: string; end: string }): string {
  const now = new Date();
  switch (period) {
    case "1h":
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    case "custom":
      if (customDateRange?.start && customDateRange?.end) {
        return new Date(customDateRange.start).toISOString();
      }
      return new Date("1970-01-01").toISOString();
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }
}

// Event colors: hex for charts, Tailwind for dots / UI
export function getEventColor(event: string): string {
  switch (event) {
    case "copy_cdkey":
      return "#10B981"; // green
    case "download_click":
      return "#3B82F6"; // blue
    case "social_click":
      return "#8B5CF6"; // purple
    case "page_viewed":
      return "#F59E0B"; // amber
    default:
      return "#6B7280"; // gray
  }
}

export function getEventDotColor(event: string): string {
  switch (event) {
    case "copy_cdkey":
      return "bg-green-500"; // green
    case "download_click":
      return "bg-blue-500"; // blue
    case "social_click":
      return "bg-purple-500"; // purple
    case "page_viewed":
      return "bg-amber-500"; // amber
    default:
      return "bg-gray-500"; // gray
  }
}

/** Dot color for a row; not-found `page_viewed` uses rose. */
export function getTrackingRowDotClass(event: AnalyticsEventData): string {
  if (isPageViewNotFoundRow(event)) return "bg-rose-500";
  return getEventDotColor(event.event);
}

// Roll up raw events into maps for dashboard tables
export interface AggregatedData {
  totals: Map<string, number>;
  byProgram: Map<string, number>;
  bySocial: Map<string, number>;
  byPath: Map<string, number>;
  byCountry: Map<string, number>;
  byReferrer: Map<string, number>;
}

export function aggregateEvents(events: AnalyticsEventData[]): AggregatedData {
  const totals = new Map<string, number>();
  const byProgram = new Map<string, number>();
  const bySocial = new Map<string, number>();
  const byPath = new Map<string, number>();
  const byCountry = new Map<string, number>();
  const byReferrer = new Map<string, number>();

  for (const event of events) {
    totals.set(event.event, (totals.get(event.event) || 0) + 1);
    if (event.programSlug && !(event.event === "page_viewed" && event.notFound === true)) {
      byProgram.set(event.programSlug, (byProgram.get(event.programSlug) || 0) + 1);
    }
    if (event.social) bySocial.set(event.social, (bySocial.get(event.social) || 0) + 1);
    if (event.path && !isPageViewNotFoundRow(event)) {
      byPath.set(event.path, (byPath.get(event.path) || 0) + 1);
    }
    if (event.country) byCountry.set(event.country, (byCountry.get(event.country) || 0) + 1);
    if (event.referrer) {
      const { hostname } = extractReferrerInfo(event.referrer);
      if (hostname) byReferrer.set(hostname, (byReferrer.get(hostname) || 0) + 1);
    }
  }

  return { totals, byProgram, bySocial, byPath, byCountry, byReferrer };
}

// Maps → chart rows / table rows for DataTable & EventChart
export interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

export interface TableDataItem {
  key: string;
  value: number;
  label: string;
}

export function transformEventData(totals: Map<string, number>): ChartDataItem[] {
  return Array.from(totals).map(([name, count]) => ({
    name: name.replace(/_/g, " ").toUpperCase(),
    value: count,
    color: getEventColor(name)
  }));
}

export function transformProgramData(byProgram: Map<string, number>): TableDataItem[] {
  return Array.from(byProgram).map(([slug, count]) => ({
    key: slug,
    value: count,
    label: slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  }));
}

export function transformSocialData(bySocial: Map<string, number>): TableDataItem[] {
  return Array.from(bySocial).map(([name, count]) => ({
    key: name,
    value: count,
    label: name.charAt(0).toUpperCase() + name.slice(1)
  }));
}

export function transformPathData(byPath: Map<string, number>): TableDataItem[] {
  return Array.from(byPath).map(([path, count]) => ({
    key: path,
    value: count,
    label:
      path === "/"
        ? "Home"
        : path
            .replace(/^\//, "")
            .replace(/\//g, " | ")
            .replace(/-/g, " ")
            .replace(/\b\w/g, l => l.toUpperCase())
  }));
}

/** Page activity: paths + one “Not Found” row (when count > 0), all sorted by view count descending. */
export function transformPathActivityTable(events: AnalyticsEventData[], byPath: Map<string, number>): TableDataItem[] {
  const notFoundCount = events.filter(isPageViewNotFoundRow).length;
  const rows: TableDataItem[] = Array.from(byPath).map(([path, count]) => ({
    key: path,
    value: count,
    label: path === "/" ? "Home" : formatPath(path)
  }));
  if (notFoundCount > 0) {
    rows.push({ key: "__not_found__", value: notFoundCount, label: "Not Found" });
  }
  return rows.sort((a, b) => b.value - a.value);
}

export function transformCountryData(byCountry: Map<string, number>): TableDataItem[] {
  return Array.from(byCountry).map(([country, count]) => ({
    key: country,
    value: count,
    label: country
  }));
}

export function transformReferrerData(byReferrer: Map<string, number>): TableDataItem[] {
  return Array.from(byReferrer).map(([hostname, count]) => ({
    key: hostname,
    value: count,
    label: hostname
  }));
}

export function transformReferrerDataWithParams(
  events: AnalyticsEventData[]
): Array<{ key: string; value: number; label: string; referrerParam?: string }> {
  const referrerMap = new Map<string, { count: number; referrerParam?: string }>();

  for (const event of events) {
    if (event.referrer) {
      const { hostname, referrerParam } = extractReferrerInfo(event.referrer);
      const existing = referrerMap.get(hostname);
      referrerMap.set(hostname, {
        count: (existing?.count || 0) + 1,
        referrerParam: referrerParam || existing?.referrerParam
      });
    }
  }

  return Array.from(referrerMap).map(([hostname, data]) => ({
    key: hostname,
    value: data.count,
    label: hostname,
    referrerParam: data.referrerParam
  }));
}

// Referrer: unwrap nested `?referrer=`; bucket hostnames for Top Referrers
/** Hostname (www-stripped for bucketing) and optional nested `referrer` on the effective URL. */
export function extractReferrerInfo(referrer: string): { hostname: string; referrerParam?: string } {
  const { hostname, nestedReferrerParam } = resolveEffectiveReferrer(referrer);
  return { hostname: referrerBucketHostname(hostname), referrerParam: nestedReferrerParam };
}

/** Full effective URL for admin links (after re-attribution). */
export function effectiveReferrerHref(referrer: string): string {
  const { effectiveHref } = resolveEffectiveReferrer(referrer);
  return effectiveHref || referrer;
}

// Labels for admin UI (event type, slug, path segments)
export function formatEventName(event: string): string {
  return event.replace(/_/g, " ").toUpperCase();
}

export function formatProgramSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

export function formatPath(path: string): string {
  if (path === "/") return "Home";
  return path
    .replace(/^\//, "")
    .replace(/\//g, " | ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}
