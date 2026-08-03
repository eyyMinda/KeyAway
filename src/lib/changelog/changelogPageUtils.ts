import type { ChangelogRelease } from "@/src/lib/changelog/changelogEntries";
import { buildMonthSidebarIndex, formatMonthName, getMonthKey, parseMonthQueryParam } from "@/src/lib/site/monthSidebarUtils";

export type ChangelogMonthGroup = {
  monthKey: string;
  monthName: string;
  releases: ChangelogRelease[];
};

export function groupChangelogByMonth(releases: ChangelogRelease[]): ChangelogMonthGroup[] {
  const groups: ChangelogMonthGroup[] = [];
  let current: ChangelogMonthGroup | null = null;

  for (const release of releases) {
    const monthKey = getMonthKey(release.releasedAt);
    if (!current || current.monthKey !== monthKey) {
      current = { monthKey, monthName: formatMonthName(monthKey), releases: [] };
      groups.push(current);
    }
    current.releases.push(release);
  }

  return groups;
}

export function buildChangelogSidebarIndex(releases: ChangelogRelease[]) {
  return buildMonthSidebarIndex(releases, r => r.releasedAt);
}

export function filterChangelogByMonth(
  releases: ChangelogRelease[],
  monthKey: string | undefined
): ChangelogRelease[] {
  if (!monthKey) return releases;
  return releases.filter(r => getMonthKey(r.releasedAt) === monthKey);
}

export function resolveChangelogPageParams(raw: { month?: string; limit?: string }) {
  const month = parseMonthQueryParam(raw.month);
  return { month };
}

export function buildChangelogHref(month: string | undefined, limit?: number): string {
  const params = new URLSearchParams();
  if (month) {
    params.set("month", month);
  } else if (limit !== undefined && limit > 0) {
    params.set("limit", String(limit));
  }
  const q = params.toString();
  return q ? `/changelog?${q}` : "/changelog";
}
