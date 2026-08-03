import type { Notification } from "@/src/types/notifications";
import { resolveFeedLimit, UPDATES_FEED_DEFAULT_LIMIT } from "@/src/lib/site/feedLimitUtils";
import {
  buildMonthSidebarIndex as buildMonthSidebarIndexFromDates,
  formatMonthLabel,
  formatMonthName,
  getMonthKey,
  parseMonthQueryParam,
  type SidebarMonth,
  type SidebarYear
} from "@/src/lib/site/monthSidebarUtils";

export type { SidebarMonth, SidebarYear };
export { formatMonthLabel, formatMonthName, getMonthKey };

export type UpdatesPageParams = {
  month?: string;
  limit: number;
};

export type TimelineMonth = {
  monthKey: string;
  monthName: string;
  items: Notification[];
};

export type TimelineYear = {
  year: number;
  months: TimelineMonth[];
};

export function resolveUpdatesPageParams(raw: { month?: string; limit?: string }): UpdatesPageParams {
  const month = parseMonthQueryParam(raw.month);
  const limit = resolveFeedLimit(raw.limit, UPDATES_FEED_DEFAULT_LIMIT);
  return { month, limit };
}

export function buildUpdatesHref(month: string | undefined, limit?: number): string {
  const params = new URLSearchParams();
  if (month) {
    params.set("month", month);
  } else if (limit !== undefined && limit > UPDATES_FEED_DEFAULT_LIMIT) {
    params.set("limit", String(limit));
  }
  const q = params.toString();
  return q ? `/updates?${q}` : "/updates";
}

export function filterNotificationsByMonth(
  notifications: Notification[],
  monthKey: string | undefined
): Notification[] {
  if (!monthKey) return notifications;
  return notifications.filter(n => getMonthKey(n.createdAt) === monthKey);
}

export function groupSortedNotifications(items: Notification[]): TimelineYear[] {
  const years: TimelineYear[] = [];
  let currentYear: TimelineYear | null = null;
  let currentMonth: TimelineMonth | null = null;

  for (const item of items) {
    const d = new Date(item.createdAt);
    if (!Number.isFinite(d.getTime())) continue;

    const year = d.getFullYear();
    const monthKey = getMonthKey(item.createdAt);
    const monthName = formatMonthName(monthKey);

    if (!currentYear || currentYear.year !== year) {
      currentYear = { year, months: [] };
      years.push(currentYear);
      currentMonth = null;
    }

    if (!currentMonth || currentMonth.monthKey !== monthKey) {
      currentMonth = { monthKey, monthName, items: [] };
      currentYear.months.push(currentMonth);
    }

    currentMonth.items.push(item);
  }

  return years;
}

export function buildMonthSidebarIndex(notifications: Notification[]): SidebarYear[] {
  return buildMonthSidebarIndexFromDates(notifications, n => n.createdAt);
}

export function formatUpdateDay(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatUpdateDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
