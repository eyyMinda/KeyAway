import { AnalyticsEventData } from "@/src/types";

// Date utilities
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
        // Return the start date for the query
        return new Date(customDateRange.start).toISOString();
      }
      // Return a very old date if custom range is not properly set (will result in no events)
      return new Date("1970-01-01").toISOString();
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }
}

// Event color utilities
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
      return "bg-green-500";
    case "download_click":
      return "bg-blue-500";
    case "social_click":
      return "bg-purple-500";
    case "page_viewed":
      return "bg-amber-500";
    default:
      return "bg-gray-500";
  }
}

// Data aggregation utilities
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
    if (event.programSlug) byProgram.set(event.programSlug, (byProgram.get(event.programSlug) || 0) + 1);
    if (event.social) bySocial.set(event.social, (bySocial.get(event.social) || 0) + 1);
    if (event.path) byPath.set(event.path, (byPath.get(event.path) || 0) + 1);
    if (event.country) byCountry.set(event.country, (byCountry.get(event.country) || 0) + 1);
    if (event.referrer) {
      try {
        const hostname = event.referrer.startsWith("http") ? new URL(event.referrer).hostname : "www.keyaway.app";
        byReferrer.set(hostname, (byReferrer.get(hostname) || 0) + 1);
      } catch {
        // Invalid URL, skip
      }
    }
  }

  return { totals, byProgram, bySocial, byPath, byCountry, byReferrer };
}

// Data transformation utilities
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
      const key = hostname;
      const existing = referrerMap.get(key);
      referrerMap.set(key, {
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

// Referrer utilities
export function extractReferrerInfo(referrer: string): { hostname: string; referrerParam?: string } {
  try {
    if (referrer.startsWith("http")) {
      const url = new URL(referrer);
      const referrerParam = url.searchParams.get("referrer");
      return {
        hostname: url.hostname,
        referrerParam: referrerParam || undefined
      };
    } else {
      // For relative URLs, assume it's from keyaway.app
      const url = new URL(`https://www.keyaway.app${referrer}`);
      const referrerParam = url.searchParams.get("referrer");
      return {
        hostname: "www.keyaway.app",
        referrerParam: referrerParam || undefined
      };
    }
  } catch {
    return {
      hostname: "www.keyaway.app",
      referrerParam: undefined
    };
  }
}

// Format utilities
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
