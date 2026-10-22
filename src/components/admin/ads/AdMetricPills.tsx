/** @fileoverview Small shared bits of the admin Ads page: fill-rate pill, unit badge, inline sparkline. */
import { fillRate, percent, type AdCounts } from "@/src/lib/ads/adStatsView";

export function FillPill({ counts }: { counts: AdCounts }) {
  if (!counts.loads) return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
  const rate = fillRate(counts);
  const tone =
    rate >= 0.7
      ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
      : rate >= 0.4
        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
        : "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300";
  return (
    <span
      title={`${counts.fills.toLocaleString()} of ${counts.loads.toLocaleString()} loads showed an ad`}
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${tone}`}>
      {percent(rate, 0)}
    </span>
  );
}

export function UnitBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      {label}
    </span>
  );
}

export function MiniSpark({ values, className = "h-6 w-20" }: { values: number[]; className?: string }) {
  if (values.length < 2 || values.every(v => v === 0)) return <span className={className} />;
  const max = Math.max(...values, 1);
  const step = 100 / (values.length - 1);
  const line = values.map((v, i) => `${(i * step).toFixed(2)},${(20 - (v / max) * 18).toFixed(2)}`).join(" ");
  return (
    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className={`${className} text-primary-500`} aria-hidden>
      <polygon points={`0,20 ${line} 100,20`} className="fill-current opacity-10" />
      <polyline points={line} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
