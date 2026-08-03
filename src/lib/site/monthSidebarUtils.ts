const MONTH_KEY_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export type SidebarMonth = {
  key: string;
  label: string;
  year: number;
  monthName: string;
  count: number;
};

export type SidebarYear = {
  year: number;
  months: SidebarMonth[];
};

export function getMonthKey(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "0000-00";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(monthKey: string): string {
  const match = MONTH_KEY_RE.exec(monthKey);
  if (!match) return monthKey;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatMonthName(monthKey: string): string {
  const match = MONTH_KEY_RE.exec(monthKey);
  if (!match) return monthKey;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long" });
}

export function buildMonthSidebarIndex<T>(items: T[], getDate: (item: T) => string): SidebarYear[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = getMonthKey(getDate(item));
    if (key === "0000-00") continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const byYear = new Map<number, SidebarMonth[]>();

  for (const key of [...counts.keys()].sort((a, b) => b.localeCompare(a))) {
    const year = Number(key.split("-")[0]);
    const entry: SidebarMonth = {
      key,
      label: formatMonthLabel(key),
      year,
      monthName: formatMonthName(key),
      count: counts.get(key) ?? 0
    };
    const list = byYear.get(year) ?? [];
    list.push(entry);
    byYear.set(year, list);
  }

  return [...byYear.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, months]) => ({ year, months }));
}

export function parseMonthQueryParam(raw: string | undefined): string | undefined {
  return raw && MONTH_KEY_RE.test(raw) ? raw : undefined;
}
