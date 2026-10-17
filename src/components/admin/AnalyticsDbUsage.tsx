"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AnalyticsDbUsage as Payload } from "@/src/lib/admin/analyticsDbUsage.server";

const LABELS: Record<string, { label: string; href?: string }> = {
  events: { label: "Events", href: "/admin/analytics" },
  sessions: { label: "Sessions", href: "/admin/sessions" },
  visitors: { label: "Visitors" },
  key_reports: { label: "Key reports", href: "/admin/key-reports" }
};

const MB = 1024 * 1024;

function barClass(ratio: number) {
  if (ratio >= 0.85) return "bg-red-500";
  if (ratio >= 0.7) return "bg-amber-500";
  return "bg-primary-600";
}

function Growth({ n }: { n: number }) {
  if (!n) return <span className="text-gray-300">—</span>;
  return <span className="tabular-nums text-gray-500 dark:text-gray-400">+{n.toLocaleString()}</span>;
}

/** Supabase analytics database: size against the free-tier limit, plus row growth per table. */
export default function AnalyticsDbUsage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/admin/analytics-db")
      .then(res => res.json())
      .then(body => {
        const d = body?.data;
        if (!d || typeof d.sizeBytes !== "number" || !Array.isArray(d.tables)) {
          setError("Failed to load");
          return;
        }
        setData(d);
      })
      .catch(() => setError("Failed to load"));
  }, []);

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Analytics database</h3>
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="bg-gray-100 dark:bg-gray-800 rounded-xl h-48 animate-pulse" />;
  }

  const ratio = data.limitBytes > 0 ? data.sizeBytes / data.limitBytes : 0;
  const pct = Math.min(100, Math.round(ratio * 100));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analytics database</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
          <span className="text-gray-900 dark:text-gray-100 font-semibold">{(data.sizeBytes / MB).toFixed(1)} MB</span>
          {" / "}
          {Math.round(data.limitBytes / MB)} MB
          <span className="ml-2">{pct}%</span>
        </p>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full ${barClass(ratio)}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-4">Supabase Postgres · cached 10 min</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
              <th className="text-left font-medium pb-2 pr-4">Table</th>
              <th className="text-right font-medium pb-2 px-2 w-24">Rows</th>
              <th className="text-right font-medium pb-2 px-2 w-20">24h</th>
              <th className="text-right font-medium pb-2 pl-2 w-20">7d</th>
            </tr>
          </thead>
          <tbody>
            {data.tables.map(row => {
              const meta = LABELS[row.table] ?? { label: row.table };
              const label = <span className="font-medium text-gray-900 dark:text-gray-100">{meta.label}</span>;
              return (
                <tr key={row.table} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4">
                    {meta.href ? (
                      <Link href={meta.href} className="hover:text-primary-700 dark:hover:text-sky-300">
                        {label}
                      </Link>
                    ) : (
                      label
                    )}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-gray-900 dark:text-gray-100 font-medium">
                    {row.rows.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <Growth n={row.day} />
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <Growth n={row.week} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
