"use client";

/** @fileoverview Promotion button clicks for the selected period: trend by placement, placement table, top pages. */
import { useMemo } from "react";
import type { AnalyticsTimeline, PromotionCampaignSummary, PromotionClickSummary } from "@/src/lib/api/adminEventsListCache";
import StackedColumnChart, { type ChartPoint } from "@/src/components/admin/charts/StackedColumnChart";
import { MiniSpark } from "@/src/components/admin/ads/AdMetricPills";
import { PROMO_PLACEMENT_SERIES, formatBucket } from "@/src/lib/analytics/activitySeries";
import { formatPath } from "@/src/lib/analytics/analyticsUtils";
import { getPromotionTheme } from "@/src/lib/promotions/promotionThemes";

type PromotionTrackingProps = {
  timeline: AnalyticsTimeline;
  promotions: PromotionClickSummary;
  pageViews: number;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-semibold leading-tight text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

const campaignDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

/** Conversion treats a click as a success: the share of everyone active during the campaign who clicked. */
function CampaignPanel({ campaign }: { campaign: PromotionCampaignSummary }) {
  const rate = campaign.reached ? (campaign.converted / campaign.reached) * 100 : 0;
  const rateText = rate > 0 && rate < 0.01 ? "<0.01%" : `${rate.toFixed(2)}%`;

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-3 border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-5 lg:grid-cols-2">
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden className="text-3xl leading-none">
          {getPromotionTheme(campaign.theme).emoji}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{campaign.title}</p>
            {campaign.live ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2 text-[11px] font-semibold leading-5 text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" aria-hidden />
                Live now
              </span>
            ) : (
              <span className="rounded-full border border-gray-200 px-2 text-[11px] font-semibold leading-5 text-gray-600 dark:border-gray-700 dark:text-gray-300">
                Ended
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {campaignDate(campaign.startsAt)} – {campaignDate(campaign.endsAt)}
          </p>
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Conversion, whole campaign</p>
          <p className="text-2xl font-semibold leading-none text-gray-900 dark:text-gray-100">{rateText}</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div className="h-full rounded-full bg-(--viz-3)" style={{ width: `${Math.min(100, Math.max(rate > 0 ? 1 : 0, rate))}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-300">
          {campaign.converted.toLocaleString()} of {campaign.reached.toLocaleString()} visitors clicked ·{" "}
          {campaign.clicks.toLocaleString()} clicks
        </p>
      </div>
    </div>
  );
}

export default function PromotionTracking({ timeline, promotions, pageViews }: PromotionTrackingProps) {
  const { bucket } = timeline;
  const points = useMemo<ChartPoint[]>(
    () =>
      timeline.points.map(p => ({
        key: p.t,
        label: formatBucket(p.t, bucket),
        title: formatBucket(p.t, bucket, true),
        values: p.breakdown.promo
      })),
    [timeline.points, bucket]
  );

  const rows = PROMO_PLACEMENT_SERIES.flatMap(series => {
    const row = promotions.placements.find(p => p.key === series.key);
    return row ? [{ ...row, series }] : [];
  }).sort((a, b) => b.clicks - a.clicks);

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 overflow-hidden min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b border-gray-200 dark:border-gray-800 px-4 py-3 sm:px-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Promotions</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Clicks on campaign buttons in this period</p>
        </div>
        {promotions.clicks > 0 && (
          <div className="flex gap-8">
            <Stat label="Clicks" value={promotions.clicks.toLocaleString()} />
            <Stat label="Visitors" value={promotions.visitors.toLocaleString()} />
            {pageViews > 0 && <Stat label="Per 100 views" value={((promotions.clicks / pageViews) * 100).toFixed(1)} />}
          </div>
        )}
      </div>

      {promotions.campaign && <CampaignPanel campaign={promotions.campaign} />}

      {promotions.clicks === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No promotion clicks in this period</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="min-w-0 p-4 sm:p-5">
            <StackedColumnChart points={points} series={PROMO_PLACEMENT_SERIES} label="Promotion clicks by placement" height={170} />
          </div>

          <div className="min-w-0 border-t border-gray-200 dark:border-gray-800 lg:border-t-0 lg:border-l">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-2 font-medium sm:px-5">Placement</th>
                    <th className="px-2 py-2 text-right font-medium">Clicks</th>
                    <th className="px-2 py-2 text-right font-medium">Visitors</th>
                    <th className="px-2 py-2 text-right font-medium">Share</th>
                    <th className="hidden px-4 py-2 font-medium sm:table-cell sm:px-5">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rows.map(row => (
                    <tr key={row.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-4 py-2.5 sm:px-5">
                        <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: row.series.color }} />
                          <span>{row.series.label}</span>
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-gray-900 dark:text-gray-100">{row.clicks.toLocaleString()}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-gray-900 dark:text-gray-100">{row.visitors.toLocaleString()}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                        {((row.clicks / promotions.clicks) * 100).toFixed(0)}%
                      </td>
                      <td className="hidden px-4 py-2.5 sm:table-cell sm:px-5">
                        <MiniSpark values={points.map(p => p.values[row.key] ?? 0)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {promotions.pages.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 sm:px-5">
                <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Top pages</p>
                <ul className="space-y-1">
                  {promotions.pages.map(page => (
                    <li key={page.path} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-gray-700 dark:text-gray-300">{formatPath(page.path)}</span>
                      <span className="tabular-nums text-gray-900 dark:text-gray-100">{page.clicks.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="border-t border-gray-200 dark:border-gray-800 px-4 py-2 text-[11px] text-gray-500 dark:text-gray-400 sm:px-5">
        A click counts as a success. Conversion is visitors who clicked, out of everyone active on the site during the campaign, since the banner shows on every page. Joins on Facebook aren&apos;t visible here.
      </p>
    </section>
  );
}
