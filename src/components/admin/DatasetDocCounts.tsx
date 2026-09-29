"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = { type: string; count: number; day: number; week: number };

type Payload = {
  total: number;
  day: number;
  week: number;
  limit: number;
  counts: Row[];
};

const LABELS: Record<string, { label: string; href?: string }> = {
  visitor: { label: "Visitors" },
  keyReport: { label: "Key reports", href: "/admin/key-reports" },
  keyReportBundle: { label: "Key report bundles", href: "/admin/key-reports" },
  cronRun: { label: "Cron runs" },
  "sanity.imageAsset": { label: "Images" },
  trackingSessionBundle: { label: "Session bundles" },
  trackingSession: { label: "Open sessions", href: "/admin/sessions" },
  changelogRelease: { label: "Changelog" },
  visitorBundle: { label: "Visitor bundles" },
  program: { label: "Programs", href: "/admin/programs" },
  contactMessage: { label: "Messages", href: "/admin/messages" },
  keySuggestion: { label: "Key suggestions", href: "/admin/key-suggestions" },
  programCategory: { label: "Categories" },
  vendor: { label: "Vendors" },
  socialLink: { label: "Social links" },
  siteNotificationBundle: { label: "Notification bundles" },
  headerLink: { label: "Header links" },
  siteNotificationFeed: { label: "Notification feed" },
  featuredProgramSettings: { label: "Featured program" },
  storeDetails: { label: "Store details" },
  analyticsMigration: { label: "Analytics migration" },
  footer: { label: "Footer" },
  header: { label: "Header" },
  "system.group": { label: "System groups" },
  "system.retention": { label: "System retention" },
  "system.schema": { label: "System schema" }
};

function barClass(ratio: number) {
  if (ratio >= 0.85) return "bg-red-500";
  if (ratio >= 0.7) return "bg-amber-500";
  return "bg-primary-600";
}

/** Large inflow that is still stored. */
function growthClass(n: number) {
  if (n >= 500) return "text-red-600 font-semibold";
  if (n >= 150) return "text-amber-700 font-medium";
  return "text-gray-500";
}

/** Stock that is mostly older than 7 days, so nothing is clearing it. */
function stockClass(count: number, week: number) {
  if (count >= 200 && count - week >= 200) return "text-amber-700 font-semibold";
  return "text-gray-900 font-medium";
}

function Growth({ n }: { n: number }) {
  if (!n) return <span className="text-gray-300">—</span>;
  return <span className={`tabular-nums ${growthClass(n)}`}>+{n.toLocaleString()}</span>;
}

const PAGE_STEP = 10;

export default function DatasetDocCounts() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_STEP);

  useEffect(() => {
    fetch("/api/v1/admin/dataset-counts")
      .then(res => res.json())
      .then(body => {
        const d = body?.data;
        if (!d || typeof d.total !== "number" || !Array.isArray(d.counts)) {
          setError("Failed to load");
          return;
        }
        setData(d);
      })
      .catch(() => setError("Failed to load"));
  }, []);

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sanity documents</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="bg-gray-100 rounded-xl h-64 animate-pulse" />;
  }

  const ratio = data.limit > 0 ? data.total / data.limit : 0;
  const pct = Math.min(100, Math.round(ratio * 100));
  const shownRows = data.counts.slice(0, visible);
  const remaining = data.counts.length - shownRows.length;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Sanity documents</h3>
        <p className="text-sm text-gray-500 tabular-nums">
          <span className="text-gray-900 font-semibold">{data.total.toLocaleString()}</span>
          {" / "}
          {data.limit.toLocaleString()}
          <span className="ml-2">{pct}%</span>
        </p>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${barClass(ratio)}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        <span className="tabular-nums text-gray-700">+{(data.day ?? 0).toLocaleString()}</span> in 24h
        <span className="mx-1.5 text-gray-300">·</span>
        <span className="tabular-nums text-gray-700">+{(data.week ?? 0).toLocaleString()}</span> in 7d still stored
        <span className="mx-1.5 text-gray-300">·</span>
        cached 10 min
      </p>
      <p className="text-xs text-gray-400 mt-1 mb-4">
        Amber totals are mostly older than 7 days. Red growth is still landing as new documents.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-gray-400">
              <th className="text-left font-medium pb-2 pr-4">Type</th>
              <th className="text-right font-medium pb-2 px-2 w-24">Docs</th>
              <th className="text-right font-medium pb-2 px-2 w-20">24h</th>
              <th className="text-right font-medium pb-2 pl-2 w-20">7d</th>
            </tr>
          </thead>
          <tbody>
            {shownRows.map(row => {
              const meta = LABELS[row.type] ?? { label: row.type };
              const label = <span className="font-medium text-gray-900">{meta.label}</span>;
              return (
                <tr key={row.type} className="border-t border-gray-100">
                  <td className="py-2 pr-4 min-w-0">
                    {meta.href ? (
                      <Link href={meta.href} className="hover:text-primary-700">
                        {label}
                      </Link>
                    ) : (
                      label
                    )}
                    <span className="ml-2 text-xs text-gray-400">{row.type}</span>
                  </td>
                  <td className={`py-2 px-2 text-right tabular-nums ${stockClass(row.count, row.week ?? 0)}`}>
                    {row.count.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <Growth n={row.day ?? 0} />
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <Growth n={row.week ?? 0} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {remaining > 0 ? (
        <button
          type="button"
          onClick={() => setVisible(v => v + PAGE_STEP)}
          className="mt-4 w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
          Show more ({remaining})
        </button>
      ) : null}
    </div>
  );
}
