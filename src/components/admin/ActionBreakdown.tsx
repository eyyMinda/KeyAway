/** @fileoverview What visitors did besides viewing pages: each action's count, share of all actions, and rate per 100 page views. */
import { getEventDotColor, formatEventName } from "@/src/lib/analytics/analyticsUtils";

const LABELS: Record<string, string> = {
  copy_cdkey: "Key copies",
  copy_pro_account: "Account copies",
  download_click: "Downloads",
  click_activation_link: "Activation links",
  social_click: "Shares",
  affiliate_click: "Affiliate clicks"
};

/** Page views are the denominator; contributions have their own admin pages. */
const EXCLUDED = new Set(["page_viewed", "comment", "comment_reply", "key_suggestion", "contact"]);

/** Action events (clicks besides page views) with their counts, largest first. */
export function actionRows(totals: Record<string, number>): Array<[string, number]> {
  return Object.entries(totals)
    .filter(([event, n]) => !EXCLUDED.has(event) && n > 0)
    .sort((a, b) => b[1] - a[1]);
}

function label(event: string): string {
  if (LABELS[event]) return LABELS[event];
  const name = formatEventName(event).toLowerCase();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function ActionBreakdown({ totals }: { totals: Record<string, number> }) {
  const rows = actionRows(totals);
  const total = rows.reduce((n, [, v]) => n + v, 0);
  const views = totals.page_viewed ?? 0;
  const max = rows[0]?.[1] ?? 1;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 p-4 sm:p-5 min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Actions</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{total.toLocaleString()} total</span>
      </div>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">Share of actions · rate per 100 page views</p>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-12 text-center">No actions in this period</p>
      ) : (
        <ul className="space-y-3">
          {rows.map(([event, value]) => (
            <li key={event}>
              <div className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full shrink-0 ${getEventDotColor(event)}`} />
                <span className="text-gray-900 dark:text-gray-100 truncate">{label(event)}</span>
                <span className="ml-auto font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{value.toLocaleString()}</span>
                <span className="w-11 text-right text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                  {((value / total) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 pl-4">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className="h-full rounded-full bg-primary-500" style={{ width: `${(value / max) * 100}%` }} />
                </div>
                {views > 0 && (
                  <span className="w-11 text-right text-[11px] text-gray-400 dark:text-gray-500 tabular-nums" title="Per 100 page views">
                    {((value / views) * 100).toFixed(1)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
