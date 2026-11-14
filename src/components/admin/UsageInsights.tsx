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
import type { QueryTraffic, UsageInsights as Payload, UserAgentTraffic } from "@/src/lib/admin/usageInsights.server";
import { describeQuery, type QueryDescription } from "@/src/lib/admin/describeQuery";

const card = "rounded-xl border border-gray-200 bg-white p-6 shadow-soft dark:border-gray-800 dark:bg-gray-900";

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

const compact = (n: number) => new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "—");

/** Supabase free plan egress per billing period. */
const EGRESS_QUOTA_BYTES = 5 * 1024 ** 3;
const MIN_PROJECTION_DAYS = 2;

type QueryGroup = QueryDescription & { bytes: number; calls: number; rows: number; sql: string[] };

/** Top queries under plain names; several statements can share one (e.g. both ad statistics writes). */
function groupQueries(top: QueryTraffic[]): QueryGroup[] {
  const groups = new Map<string, QueryGroup>();
  for (const q of top) {
    const description = describeQuery(q.query);
    const group = groups.get(description.name) ?? { ...description, bytes: 0, calls: 0, rows: 0, sql: [] };
    group.bytes += q.estBytes;
    group.calls += q.calls;
    group.rows += q.rows;
    group.sql.push(q.query);
    groups.set(description.name, group);
  }
  return [...groups.values()].sort((a, b) => b.bytes - a.bytes);
}

function quotaTone(ratio: number) {
  if (ratio >= 0.9) return { bar: "bg-red-500", text: "text-red-700 dark:text-red-300" };
  if (ratio >= 0.7) return { bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" };
  return { bar: "bg-green-500", text: "text-green-700 dark:text-green-300" };
}

const smallButton =
  "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800";

function DbTrafficCard({ data, onReset, resetting }: { data: Payload; onReset: () => void; resetting: boolean }) {
  const { traffic, supabaseProjectUrl } = data;
  const days = traffic.days ?? 0;
  const monthly = days >= MIN_PROJECTION_DAYS ? ((traffic.estBytes ?? 0) / days) * 30 : null;
  const ratio = monthly != null ? monthly / EGRESS_QUOTA_BYTES : 0;
  const tone = quotaTone(ratio);
  const groups = groupQueries(traffic.top ?? []);
  const shown = groups.reduce((n, g) => n + g.bytes, 0);

  return (
    <div className={card}>
      <div className="mb-4 flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Database traffic</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">Data sent from the database to the site (egress).</p>
        </div>
        {traffic.available && (
          <button
            type="button"
            onClick={onReset}
            disabled={resetting}
            className={smallButton}
            title="Start counting again from now, e.g. after fixing a heavy query">
            {resetting ? "Resetting…" : "Reset counters"}
          </button>
        )}
        {supabaseProjectUrl && (
          <a
            href={supabaseProjectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={smallButton}
            title="The billed egress is on Supabase's usage page">
            Supabase <FaExternalLinkAlt className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      {!traffic.available ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Query statistics are not available.</p>
      ) : (
        <>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
            {monthly != null ? (
              <>
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className={`text-2xl font-semibold tabular-nums ${tone.text}`}>~{formatBytes(monthly)}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">per month at the current rate</span>
                </p>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full ${tone.bar}`}
                    style={{ width: `${Math.min(100, Math.max(2, ratio * 100))}%` }}
                  />
                </div>
                <p className="mt-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{Math.round(ratio * 100)}% of the 5 GB free quota</span>
                  <span>
                    estimate from {Math.round(days)} days
                    {traffic.since && ` (since ${new Date(traffic.since).toLocaleDateString()})`}
                  </span>
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Counting since {traffic.since ? new Date(traffic.since).toLocaleString() : "recently"}. A monthly
                estimate appears after {MIN_PROJECTION_DAYS} days.
              </p>
            )}
          </div>

          {groups.length > 0 && (
            <>
              <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Where it goes
              </p>
              <ul className="space-y-3">
                {groups.map(group => {
                  const share = shown ? group.bytes / shown : 0;
                  return (
                    <li key={group.name} title={group.sql.join(" | ")}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium text-gray-900 dark:text-gray-100">
                          {group.name}
                        </span>
                        <span className="shrink-0 tabular-nums text-gray-700 dark:text-gray-300">
                          {formatBytes(group.bytes)} <span className="text-gray-400">· {Math.round(share * 100)}%</span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{ width: `${Math.max(1, share * 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {group.about} {compact(group.calls)} times, ~
                        {compact(group.calls ? group.rows / group.calls : 0)} rows each.
                      </p>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
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
