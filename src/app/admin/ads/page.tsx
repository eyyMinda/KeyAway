"use client";

/**
 * @fileoverview Admin ad performance: overview across pages, then per page type a snapshot of its placements in
 * page order, its trend, and (program / vendor / other pages) the busiest individual paths. `?page=` keeps the
 * selected tab in the URL. Data comes from the ad counter tables, not per-event rows.
 */
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FaArrowsRotate } from "react-icons/fa6";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import AdTrendChart from "@/src/components/admin/ads/AdTrendChart";
import AdPageSnapshot from "@/src/components/admin/ads/AdPageSnapshot";
import AdRankingTable from "@/src/components/admin/ads/AdRankingTable";
import AdPathsTable from "@/src/components/admin/ads/AdPathsTable";
import { FillPill, MiniSpark } from "@/src/components/admin/ads/AdMetricPills";
import { AD_PAGES, type AdPage } from "@/src/lib/ads/adPlacements";
import {
  buildTimeline,
  clickRate,
  dayRange,
  fillRate,
  pageLabel,
  percent,
  sumCounts,
  summarizePages,
  summarizePaths,
  summarizePlacements,
  type AdDailyRow,
  type AdDayPoint,
  type AdPathRow
} from "@/src/lib/ads/adStatsView";
import { adminChrome } from "@/src/theme/colorSchema";

type Period = "7d" | "30d" | "90d" | "all";
type AdStatsResponse = { daily: AdDailyRow[]; paths: AdPathRow[] };
type Tab = "overview" | AdPage;

const PERIODS: Array<{ value: Period; label: string; days?: number }> = [
  { value: "7d", label: "7 days", days: 7 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "90d", label: "90 days", days: 90 },
  { value: "all", label: "All time" }
];

/** Ad stats start with this release; "All time" begins here instead of an empty decade of days. */
const ADS_STATS_START = "2026-10-01";
const PATH_PAGES = new Set<AdPage>(["program", "vendor", "other"]);

function periodRange(period: Period): { since: string; until: string } {
  const until = new Date().toISOString().slice(0, 10);
  const days = PERIODS.find(p => p.value === period)?.days;
  if (!days) return { since: ADS_STATS_START, until };
  const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  return { since, until };
}

function StatTile({ label, value, detail, spark }: { label: string; value: string; detail?: React.ReactNode; spark?: number[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-soft p-4 flex flex-col gap-1 min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">{value}</p>
      {detail && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{detail}</div>}
      {spark && <MiniSpark values={spark} className="mt-auto h-8 w-full pt-2" />}
    </div>
  );
}

function KpiRow({ timeline }: { timeline: AdDayPoint[] }) {
  const totals = sumCounts(timeline);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatTile
        label="Ad views"
        value={totals.views.toLocaleString()}
        detail={`${totals.fills.toLocaleString()} ads shown`}
        spark={timeline.map(d => d.views)}
      />
      <StatTile
        label="Clicks (estimated)"
        value={totals.clicks.toLocaleString()}
        detail={`${percent(clickRate(totals))} of views`}
        spark={timeline.map(d => d.clicks)}
      />
      <StatTile
        label="Fill rate"
        value={totals.loads ? percent(fillRate(totals), 0) : "—"}
        detail={`${totals.loads.toLocaleString()} ad loads`}
      />
      <StatTile
        label="Not shown"
        value={Math.max(0, totals.loads - totals.fills).toLocaleString()}
        detail="Ad blocker or no ad available"
      />
    </div>
  );
}

function AdsDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get("page");
  const tab: Tab = AD_PAGES.some(p => p.id === requested) ? (requested as AdPage) : "overview";

  const [period, setPeriod] = useState<Period>("30d");
  const [reloads, setReloads] = useState(0);
  const range = useMemo(() => periodRange(period), [period]);
  const requestKey = `${range.since}|${range.until}|${reloads}`;
  // `data` keeps the previous period's numbers on screen while the next request is in flight.
  const [data, setData] = useState<AdStatsResponse | null>(null);
  const [settled, setSettled] = useState<{ key: string; error: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/admin/ads?since=${range.since}&until=${range.until}`, { cache: "no-store" })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then(json => {
        if (cancelled) return;
        setData(json.data);
        setSettled({ key: requestKey, error: false });
      })
      .catch(() => !cancelled && setSettled({ key: requestKey, error: true }));
    return () => {
      cancelled = true;
    };
  }, [requestKey, range]);

  const loading = settled?.key !== requestKey;
  const error = !loading && settled?.error === true;
  const reload = useCallback(() => setReloads(n => n + 1), []);

  const selectTab = (next: Tab) => {
    router.replace(next === "overview" ? pathname : `${pathname}?page=${next}`, { scroll: false });
  };

  const days = useMemo(() => dayRange(range.since, range.until), [range]);
  const daily = useMemo(() => data?.daily ?? [], [data]);
  const placements = useMemo(() => summarizePlacements(daily, days), [daily, days]);
  const pages = useMemo(() => summarizePages(daily, days), [daily, days]);
  const scoped = tab === "overview" ? daily : daily.filter(r => r.page === tab);
  const timeline = buildTimeline(scoped, days);

  return (
    <ProtectedAdminLayout title="Ads" subtitle="How each ad placement performs, page by page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap gap-2">
          {PERIODS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                period === p.value ? adminChrome.filterPillActive : adminChrome.filterPillIdle
              }`}>
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          title="Refresh"
          aria-label="Refresh"
          className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 cursor-pointer disabled:opacity-50 ${adminChrome.filterPillIdle}`}>
          <FaArrowsRotate className={`w-4 h-4 text-gray-700 dark:text-gray-300 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <nav className="mb-6 -mx-1 flex gap-1 overflow-x-auto border-b border-gray-200 px-1 dark:border-gray-800" aria-label="Ad pages">
        {[{ id: "overview" as Tab, label: "Overview", views: sumCounts(daily).views }, ...pages.map(p => ({ id: p.page as Tab, label: p.label, views: p.totals.views }))].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
            className={`-mb-px flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-primary-500 text-gray-900 dark:text-gray-100"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}>
            {t.label}
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {t.views.toLocaleString()}
            </span>
          </button>
        ))}
      </nav>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          Could not load ad stats. If this is the first run, apply{" "}
          <code className="font-mono">supabase/migrations/20261022000000_ad_stats.sql</code> in the Supabase SQL editor.
        </div>
      ) : loading && !data ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          <KpiRow timeline={timeline} />

          {tab === "overview" ? (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="min-w-0 lg:col-span-2">
                  <AdTrendChart points={timeline} title="All ads" />
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 p-2">
                  <h3 className="px-3 pt-2 pb-1 text-base font-semibold text-gray-900 dark:text-gray-100">Pages</h3>
                  <ul>
                    {[...pages]
                      .sort((a, b) => b.totals.views - a.totals.views)
                      .map(p => (
                        <li key={p.page}>
                          <button
                            type="button"
                            onClick={() => selectTab(p.page)}
                            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{p.label}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {p.totals.views.toLocaleString()} views · {p.totals.clicks.toLocaleString()} clicks ·{" "}
                                {percent(clickRate(p.totals))}
                              </span>
                            </span>
                            <MiniSpark values={p.timeline.map(d => d.views)} className="h-6 w-16" />
                            <FillPill counts={p.totals} />
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
              <AdRankingTable
                placements={placements}
                title="Top placements"
                onPageClick={page => selectTab(page)}
              />
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                <div className="min-w-0 xl:col-span-3">
                  <AdPageSnapshot placements={placements.filter(p => p.page === tab)} title={`${pageLabel(tab)} snapshot`} />
                </div>
                <div className="min-w-0 xl:col-span-2">
                  <AdTrendChart points={timeline} title={`${pageLabel(tab)} trend`} />
                </div>
              </div>
              {PATH_PAGES.has(tab) && (
                <AdPathsTable paths={summarizePaths(data?.paths ?? [], tab)} title={`Busiest ${pageLabel(tab).toLowerCase()}`} />
              )}
            </>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400">
            A view is an ad that rendered and stayed at least half on screen for a second. Clicks are estimated (ads are
            third-party frames): Adsterra&apos;s own dashboard has the paid numbers. Counts skip admins, bots and
            visitors who declined ad cookies.
          </p>
        </div>
      )}
    </ProtectedAdminLayout>
  );
}

export default function AdminAdsPage() {
  return (
    <Suspense fallback={null}>
      <AdsDashboard />
    </Suspense>
  );
}
