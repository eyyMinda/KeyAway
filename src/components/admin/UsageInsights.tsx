"use client";

/**
 * @fileoverview Dashboard usage cards from one request: where database traffic goes (an egress estimate from
 * pg_stat_statements), how far the analytics rollup has got, and which user agents only ever load one page, with a
 * switch to flag one as a bot so tracking skips it.
 */
import { useCallback, useEffect, useState } from "react";
import { FaExternalLinkAlt, FaRobot } from "react-icons/fa";
import { formatRelativeTimeCompact } from "@/src/lib/dateUtils";
import { describeUserAgent } from "@/src/lib/analytics/describeUserAgent";
import type { UsageInsights as Payload, UserAgentTraffic } from "@/src/lib/admin/usageInsights.server";

const card = "rounded-xl border border-gray-200 bg-white p-6 shadow-soft dark:border-gray-800 dark:bg-gray-900";

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

const compact = (n: number) => new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "—");

function DbTrafficCard({ data, onReset, resetting }: { data: Payload; onReset: () => void; resetting: boolean }) {
  const { traffic, supabaseProjectUrl } = data;
  return (
    <div className={card}>
      <div className="mb-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Database traffic</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {traffic.available ? (
              <>
                ~{formatBytes(traffic.estBytes ?? 0)} returned
                {traffic.since && ` since ${new Date(traffic.since).toLocaleDateString()}`} (
                {compact(traffic.totalRows ?? 0)} rows). An estimate: Supabase&apos;s usage page has the billed egress.
              </>
            ) : (
              "Query statistics are not available."
            )}
          </p>
        </div>
        {data.traffic.available && (
          <button
            type="button"
            onClick={onReset}
            disabled={resetting}
            title="Start the counts over, e.g. after fixing a heavy query"
            className="shrink-0 cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
            {resetting ? "Resetting…" : "Reset counters"}
          </button>
        )}
        {supabaseProjectUrl && (
          <a
            href={supabaseProjectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
            Supabase <FaExternalLinkAlt className="h-3 w-3" />
          </a>
        )}
      </div>
      {(traffic.top ?? []).length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
          {(traffic.top ?? []).map(q => (
            <li key={q.query} className="px-3 py-2">
              <p className="truncate font-mono text-xs text-gray-700 dark:text-gray-300" title={q.query}>
                {q.query}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-gray-500 dark:text-gray-400">
                ~{formatBytes(q.estBytes)} · {compact(q.rows)} rows · {compact(q.calls)} calls · {q.rowsPerCall}{" "}
                rows/call
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RollupStatusCard({ data }: { data: Payload }) {
  const { rollup } = data;
  if (!rollup) {
    return (
      <div className={card}>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analytics rollup</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">The rollup tables could not be read.</p>
      </div>
    );
  }
  return (
    <div className={card}>
      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analytics rollup</h4>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
        Older visits are kept as daily totals so the database stays small.
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">Full detail kept from</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">
            {rollup.rolledUntil
              ? new Date(`${rollup.rolledUntil}T00:00:00Z`).toLocaleDateString()
              : "Not rolled up yet"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">Days in daily totals</dt>
          <dd className="font-medium tabular-nums text-gray-900 dark:text-gray-100">
            {(rollup.daysRolled ?? 0).toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">Oldest detailed event</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">
            {rollup.rawSince ? formatRelativeTimeCompact(rollup.rawSince) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">Daily totals size</dt>
          <dd className="font-medium tabular-nums text-gray-900 dark:text-gray-100">
            {formatBytes(rollup.rollupBytes ?? 0)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function TrafficQualityCard({
  data,
  onFlag,
  saving
}: {
  data: Payload;
  onFlag: (agent: UserAgentTraffic) => void;
  saving: number | null;
}) {
  return (
    <div className={card}>
      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Traffic quality</h4>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
        Browsers with the most one-page visits in the last {data.trafficDays} days. One page alone is normal; many
        visits per visitor that only ever load the homepage are not. Flag a browser as a bot to stop recording it.
      </p>
      {data.userAgents === null && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Browser data appears once the <code>user_agents</code> migration has run.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <tr>
              <th className="py-2 pr-3 font-medium">Browser</th>
              <th className="px-2 py-2 text-right font-medium">Visits</th>
              <th className="px-2 py-2 text-right font-medium">One page</th>
              <th className="px-2 py-2 text-right font-medium">Home only</th>
              <th className="px-2 py-2 text-right font-medium" title="Visits per visitor">
                Per visitor
              </th>
              <th className="py-2 pl-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {(data.userAgents ?? []).map(agent => {
              const perVisitor = agent.visitors ? agent.sessions / agent.visitors : 0;
              return (
                <tr key={agent.id} className={agent.isBot ? "opacity-60" : ""}>
                  <td className="max-w-56 py-2 pr-3">
                    <span className="block truncate font-medium text-gray-900 dark:text-gray-100" title={agent.ua}>
                      {describeUserAgent(agent.ua)}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    {compact(agent.sessions)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    {percent(agent.onePage, agent.sessions)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    {percent(agent.homeOnly, agent.sessions)}
                  </td>
                  <td
                    className={`px-2 py-2 text-right tabular-nums ${perVisitor >= 3 ? "font-semibold text-amber-700 dark:text-amber-300" : "text-gray-700 dark:text-gray-300"}`}>
                    {perVisitor.toFixed(1)}
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <button
                      type="button"
                      disabled={saving === agent.id}
                      onClick={() => onFlag(agent)}
                      className={`inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium disabled:opacity-50 ${
                        agent.isBot
                          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                          : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-100"
                      }`}>
                      <FaRobot className="h-2.5 w-2.5" />
                      {agent.isBot ? "Bot · undo" : "Flag as bot"}
                    </button>
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

export default function UsageInsights() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/admin/usage-insights")
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`Could not load (${res.status})`))))
      .then((json: { data: Payload }) => !cancelled && setData(json.data))
      .catch(e => !cancelled && setError(e instanceof Error ? e.message : "Could not load"));
    return () => {
      cancelled = true;
    };
  }, []);

  const resetCounters = async () => {
    if (!confirm("Reset the query statistics? The traffic card and egress estimate start counting from now.")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/v1/admin/usage-insights/reset", { method: "POST" });
      if (!res.ok) throw new Error();
      const fresh = await fetch("/api/v1/admin/usage-insights");
      if (fresh.ok) setData(((await fresh.json()) as { data: Payload }).data);
    } catch {
      setError("Could not reset the counters");
    } finally {
      setResetting(false);
    }
  };

  const flag = useCallback(async (agent: UserAgentTraffic) => {
    const isBot = !agent.isBot;
    if (isBot && !confirm(`Stop recording visits from "${agent.ua}"?`)) return;
    setSaving(agent.id);
    try {
      const res = await fetch(`/api/v1/admin/user-agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBot })
      });
      if (!res.ok) throw new Error();
      setData(prev =>
        prev?.userAgents
          ? { ...prev, userAgents: prev.userAgents.map(a => (a.id === agent.id ? { ...a, isBot } : a)) }
          : prev
      );
    } catch {
      setError("Could not save the change");
    } finally {
      setSaving(null);
    }
  }, []);

  if (error && !data) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (!data) {
    // Placeholders in the final layout, so the section does not jump when the data arrives.
    return (
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2" aria-busy="true" aria-label="Loading usage">
        {[
          { id: "traffic", size: "h-56" },
          { id: "rollup", size: "h-56" },
          { id: "quality", size: "h-64 lg:col-span-2" }
        ].map(({ id, size }) => (
          <div key={id} className={`${card} ${size} animate-pulse`}>
            <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="mt-3 h-3 w-64 max-w-full rounded bg-gray-100 dark:bg-gray-800/60" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
      <DbTrafficCard data={data} onReset={() => void resetCounters()} resetting={resetting} />
      <RollupStatusCard data={data} />
      <div id="traffic-quality" className="scroll-mt-24 lg:col-span-2">
        <TrafficQualityCard data={data} onFlag={flag} saving={saving} />
      </div>
    </div>
  );
}
