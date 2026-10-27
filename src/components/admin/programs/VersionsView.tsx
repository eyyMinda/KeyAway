"use client";

import { useEffect, useState } from "react";
import { FaSyncAlt } from "react-icons/fa";
import type { ProgramEditorTab } from "@/src/lib/admin/programFields";
import type { AdminProgramRow } from "@/src/types/admin";
import { hasNewVersion, relativeTime } from "./ProgramsTableView";

type Filter = "updates" | "tracked" | "errors" | "untracked";

const SOURCE_LABELS: Record<string, string> = {
  installer: "Installer",
  page: "Vendor page",
  winget: "winget",
  filepuma: "FilePuma",
  chocolatey: "Chocolatey",
  homebrew: "Homebrew"
};

type Outcome = { programId: string; found: string | null; error: string | null };

function sourceDetail(p: AdminProgramRow): string {
  const vc = p.versionCheck;
  if (!vc?.source) return "";
  if (vc.source === "page" || vc.source === "installer") {
    try {
      return new URL((vc.source === "page" ? vc.pageUrl : vc.installerUrl) ?? "").hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }
  return vc.packageId ?? "";
}

interface VersionsViewProps {
  programs: AdminProgramRow[];
  onOpen: (id: string, tab?: ProgramEditorTab) => void;
  /** Replace one list row (after an update) or merge a partial change (after a check). */
  onRowChange: (id: string, change: Partial<AdminProgramRow> | AdminProgramRow) => void;
  onRefresh: () => void;
}

export default function VersionsView({ programs, onOpen, onRowChange, onRefresh }: VersionsViewProps) {
  const updates = programs.filter(hasNewVersion);
  const [filter, setFilter] = useState<Filter>(updates.length ? "updates" : "tracked");
  const [busy, setBusy] = useState<Record<string, "check" | "apply">>({});
  const [checkingAll, setCheckingAll] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [lastRun, setLastRun] = useState<{ ranAt: string; details?: string; status: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/admin/cron-status")
      .then(res => res.json())
      .then(data => {
        const runs: { job: string; ranAt: string; details?: string; status: string }[] = data?.data?.runs ?? [];
        if (!cancelled) setLastRun(runs.find(r => r.job === "check-versions") ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const tracked = programs.filter(p => p.versionCheck?.source);
  const errors = tracked.filter(p => p.versionStatus?.error);
  const untracked = programs.filter(p => !p.versionCheck?.source);
  const rows = (filter === "updates" ? updates : filter === "errors" ? errors : filter === "untracked" ? untracked : tracked).sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  const setRowBusy = (id: string, state?: "check" | "apply") =>
    setBusy(prev => {
      const next = { ...prev };
      if (state) next[id] = state;
      else delete next[id];
      return next;
    });

  const checkOne = async (p: AdminProgramRow) => {
    setRowBusy(p._id, "check");
    try {
      const res = await fetch(`/api/v1/admin/programs/${p._id}/version-check`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message ?? "Check failed");
      const o = data.data as Outcome;
      onRowChange(p._id, {
        versionStatus: { latestVersion: o.found ?? p.versionStatus?.latestVersion, error: o.error, changedAt: new Date().toISOString() }
      });
    } catch (err) {
      setMessage({ tone: "error", text: `${p.title}: ${err instanceof Error ? err.message : "Check failed"}` });
    } finally {
      setRowBusy(p._id);
    }
  };

  const applyOne = async (p: AdminProgramRow): Promise<boolean> => {
    const version = p.versionStatus?.latestVersion;
    if (!version) return false;
    setRowBusy(p._id, "apply");
    try {
      const res = await fetch(`/api/v1/admin/programs/${p._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { latestOfficialVersion: version } })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message ?? "Update failed");
      if (data.data?.row) onRowChange(p._id, data.data.row as AdminProgramRow);
      return true;
    } catch (err) {
      setMessage({ tone: "error", text: `${p.title}: ${err instanceof Error ? err.message : "Update failed"}` });
      return false;
    } finally {
      setRowBusy(p._id);
    }
  };

  const applyAll = async () => {
    if (!confirm(`Update the version of ${updates.length} program${updates.length === 1 ? "" : "s"}?`)) return;
    let ok = 0;
    for (const p of updates) if (await applyOne(p)) ok++;
    setMessage({ tone: "ok", text: `Updated ${ok} of ${updates.length}.` });
  };

  const checkAll = async () => {
    setCheckingAll(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/cron/check-versions", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message ?? "Check failed");
      const outcomes = (data.data?.outcomes ?? []) as Outcome[];
      setMessage({
        tone: "ok",
        text: `Checked ${outcomes.length}: ${outcomes.filter(o => o.error).length} failed.`
      });
      setLastRun({ ranAt: new Date().toISOString(), status: "ok" });
      onRefresh();
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Check failed" });
    } finally {
      setCheckingAll(false);
    }
  };

  const chip = (value: Filter, label: string, count: number) => (
    <button
      type="button"
      onClick={() => setFilter(value)}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer ${
        filter === value
          ? "bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100"
          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400"
      }`}>
      {label} <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-800">
        {chip("updates", "New versions", updates.length)}
        {chip("tracked", "Tracked", tracked.length)}
        {chip("errors", "Failed", errors.length)}
        {chip("untracked", "Not tracked", untracked.length)}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {lastRun && (
            <span className="text-xs text-gray-500 dark:text-gray-400" title={lastRun.details}>
              Last run {relativeTime(lastRun.ranAt)}
              {lastRun.status !== "ok" && " (failed)"}
            </span>
          )}
          {updates.length > 1 && (
            <button
              type="button"
              onClick={applyAll}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 cursor-pointer">
              Apply all {updates.length}
            </button>
          )}
          <button
            type="button"
            onClick={checkAll}
            disabled={checkingAll}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-60 cursor-pointer">
            <FaSyncAlt size={11} className={checkingAll ? "animate-spin" : ""} />
            {checkingAll ? "Checking…" : "Check all now"}
          </button>
        </div>
      </div>

      {message && (
        <p className={`px-4 py-2 text-sm border-b border-gray-100 dark:border-gray-800 ${message.tone === "ok" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {message.text}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
          {filter === "updates"
            ? "Everything is up to date."
            : filter === "errors"
              ? "No failed checks."
              : filter === "untracked"
                ? "Every program has version tracking."
                : "No program has version tracking yet. Set it up in a program's Basics tab."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-950/60 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Program</th>
                <th className="px-3 py-2.5 font-medium">Current</th>
                <th className="px-3 py-2.5 font-medium">Latest found</th>
                <th className="px-3 py-2.5 font-medium hidden md:table-cell">Source</th>
                <th className="px-3 py-2.5 font-medium hidden lg:table-cell">Changed</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map(p => {
                const status = p.versionStatus;
                const newer = hasNewVersion(p);
                const rowBusy = busy[p._id];
                return (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-950/40">
                    <td className="px-4 py-2.5">
                      <button type="button" onClick={() => onOpen(p._id)} className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-left">
                        {p.title}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-600 dark:text-gray-400">{p.latestOfficialVersion || "—"}</td>
                    <td className="px-3 py-2.5">
                      {status?.error ? (
                        <span className="text-xs text-red-600 dark:text-red-400" title={status.error}>
                          {status.latestVersion ? `${status.latestVersion} · ` : ""}
                          {status.error.length > 48 ? `${status.error.slice(0, 48)}…` : status.error}
                        </span>
                      ) : status?.latestVersion ? (
                        <span className={`tabular-nums ${newer ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}>
                          {status.latestVersion}
                          {!newer && <span className="ml-1.5 text-xs font-normal text-green-600 dark:text-green-400">up to date</span>}
                          {status.releasedAt && (
                            <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">released {relativeTime(status.releasedAt)}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">{p.versionCheck?.source ? "Not checked yet" : "—"}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-xs text-gray-500 dark:text-gray-400">
                      {p.versionCheck?.source ? (
                        <>
                          <span className="text-gray-700 dark:text-gray-300">{SOURCE_LABELS[p.versionCheck.source] ?? p.versionCheck.source}</span>
                          {sourceDetail(p) && <span className="ml-1">· {sourceDetail(p)}</span>}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {status?.changedAt ? relativeTime(status.changedAt) : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                        {!p.versionCheck?.source ? (
                          <button type="button" onClick={() => onOpen(p._id, "basics")} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                            Set up
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => checkOne(p)}
                              disabled={!!rowBusy}
                              className="px-2.5 py-1 text-xs font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 cursor-pointer">
                              {rowBusy === "check" ? "Checking…" : "Check now"}
                            </button>
                            {newer && (
                              <button
                                type="button"
                                onClick={() => applyOne(p)}
                                disabled={!!rowBusy}
                                className="px-3 py-1 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                                {rowBusy === "apply" ? "Updating…" : `Update to ${status?.latestVersion}`}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
