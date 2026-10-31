"use client";

/**
 * @fileoverview One key's reports: key facts, what visitors say, then a filterable list with bulk type changes.
 * Saves patch rows in place, so the modal keeps its scroll position and only the changed rows re-render.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaSpinner } from "react-icons/fa";
import AdminDetailsModal from "@/src/components/admin/AdminDetailsModal";
import KeyReportRow, { type ReportVisitor } from "@/src/components/admin/key-reports/KeyReportRow";
import {
  CopyButton,
  KEY_STATUS_OPTIONS,
  KEY_STATUS_TONES,
  REPORT_EVENT_OPTIONS,
  VersionTag,
  statusLabel
} from "@/src/components/admin/key-reports/keyReportUi";
import { AdminSearch, Chip, StatusPill } from "@/src/components/admin/list/AdminListKit";
import ReportProgressBar from "@/src/components/program/cdkeys/ReportProgressBar";
import { isKeyVersionBehind, keyReportId, suggestedKeyStatus, type KeyReportRow as Row } from "@/src/lib/admin/keyReportGroups";
import { formatVersionLabelDisplay } from "@/src/lib/program/versionFitLabel";
import type { KeyReport, KeyReportEvent } from "@/src/types";
import type { CDKeyStatus } from "@/src/types/program";

const PAGE_SIZE = 50;

type RowFilter = "all" | KeyReportEvent | "other";

type KeyReportDetailsModalProps = {
  report: KeyReport;
  savingStatus: boolean;
  onClose: () => void;
  onSetStatus: (status: CDKeyStatus) => void;
  onSetEvents: (keyId: string, reportIds: string[], eventType: KeyReportEvent) => Promise<void>;
  onSetTriedVersion: (keyId: string, reportId: string, version: string) => Promise<void>;
};

const shortDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—");

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 min-w-0 text-sm text-gray-900 dark:text-gray-100">{children}</dd>
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-lg font-semibold leading-tight text-gray-900 dark:text-gray-100">{value.toLocaleString()}</p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function topCounts(values: string[], limit: number): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export default function KeyReportDetailsModal({
  report,
  savingStatus,
  onClose,
  onSetStatus,
  onSetEvents,
  onSetTriedVersion
}: KeyReportDetailsModalProps) {
  const keyId = keyReportId(report);
  const rows = report.reports;
  const [filter, setFilter] = useState<RowFilter>("all");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [savingRows, setSavingRows] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [visitors, setVisitors] = useState<Record<string, ReportVisitor>>({});

  const hashes = useMemo(() => [...new Set(rows.map(r => r.ipHash).filter(Boolean))].join(","), [rows]);

  useEffect(() => {
    if (!hashes) return;
    let cancelled = false;
    fetch(`/api/v1/admin/visitor?hashes=${encodeURIComponent(hashes)}`)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((json: { data?: Record<string, ReportVisitor> }) => {
        if (!cancelled) setVisitors(json.data ?? {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hashes]);

  const repeats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) if (row.ipHash) counts.set(row.ipHash, (counts.get(row.ipHash) ?? 0) + 1);
    return counts;
  }, [rows]);

  const filterCounts = useMemo(() => {
    const count = (test: (r: Row) => boolean) => rows.filter(test).length;
    return {
      all: rows.length,
      report_key_working: count(r => r.eventType === "report_key_working"),
      report_key_expired: count(r => r.eventType === "report_key_expired"),
      report_key_limit_reached: count(r => r.eventType === "report_key_limit_reached"),
      other: count(r => r.triedVersionFit === "other")
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (filter === "other" && r.triedVersionFit !== "other") return false;
      if (filter !== "all" && filter !== "other" && r.eventType !== filter) return false;
      return !q || [r.city, r.country, r.referrer, r.triedVersion, r.ipHash].some(v => v?.toLowerCase().includes(q));
    });
  }, [rows, filter, search]);

  const selectedIds = useMemo(() => filtered.filter(r => selected.has(r._id)).map(r => r._id), [filtered, selected]);
  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;
  const bulkSaving = selectedIds.some(id => savingRows.has(id));

  const setRowsEvent = useCallback(
    async (ids: string[], eventType: KeyReportEvent) => {
      setError(null);
      setSavingRows(prev => new Set([...prev, ...ids]));
      try {
        await onSetEvents(keyId, ids, eventType);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not update the reports");
      } finally {
        const done = new Set(ids);
        setSavingRows(prev => new Set([...prev].filter(id => !done.has(id))));
      }
    },
    [keyId, onSetEvents]
  );

  const setOneEvent = useCallback((id: string, eventType: KeyReportEvent) => void setRowsEvent([id], eventType), [setRowsEvent]);

  const setVersion = useCallback(
    async (id: string, version: string) => {
      setError(null);
      try {
        await onSetTriedVersion(keyId, id, version);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not update the version");
      }
    },
    [keyId, onSetTriedVersion]
  );

  const toggleRow = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  const setSpammer = useCallback((hash: string, isSpammer: boolean) => {
    setVisitors(prev => ({ ...prev, [hash]: { ...prev[hash], isSpammer } }));
  }, []);

  const applyBulk = async (eventType: KeyReportEvent) => {
    await setRowsEvent(selectedIds, eventType);
    setSelected(new Set());
  };

  const { reportData: data } = report;
  const suggestion = suggestedKeyStatus(report);
  const behind = isKeyVersionBehind(report);
  const counted = data.working + data.expired + data.limit_reached;
  const countries = useMemo(() => topCounts(rows.flatMap(r => (r.country && r.country !== "Unknown" ? [r.country] : [])), 3), [rows]);
  const triedVersions = useMemo(
    () => topCounts(rows.flatMap(r => (r.triedVersion ? [formatVersionLabelDisplay(r.triedVersion)] : [])), 6),
    [rows]
  );

  const filters: Array<{ value: RowFilter; label: string }> = [
    { value: "all", label: "All" },
    ...REPORT_EVENT_OPTIONS,
    { value: "other", label: "Other version" }
  ];

  return (
    <AdminDetailsModal
      title={report.programTitle}
      subtitle={<span className="font-mono">{report.key}</span>}
      onClose={onClose}
      maxWidthClass="max-w-5xl"
      footer={`${report.reportCount.toLocaleString()} reports · last ${shortDate(report.lastReported)}`}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Fact label="Status">
              <span className="inline-flex items-center gap-1.5">
                <StatusPill
                  value={report.status}
                  options={KEY_STATUS_OPTIONS}
                  tones={KEY_STATUS_TONES}
                  disabled={savingStatus || !report.keyId}
                  onChange={onSetStatus}
                />
                {savingStatus && <FaSpinner className="h-3 w-3 animate-spin text-gray-400" aria-label="Saving" />}
              </span>
            </Fact>
            <Fact label="Version">
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <VersionTag version={report.keyVersion} behind={behind} />
                {!report.keyVersion && "—"}
                {report.latestVersion && <span className="text-xs text-gray-500 dark:text-gray-400">latest {report.latestVersion}</span>}
              </span>
            </Fact>
            <Fact label="Valid from">{shortDate(report.validFrom)}</Fact>
            <Fact label="Valid until">{shortDate(report.validTo)}</Fact>
            {report.resolvedUsername && (
              <Fact label="Username">
                <span className="flex items-center gap-1">
                  <code className="truncate font-mono text-xs">{report.resolvedUsername}</code>
                  <CopyButton value={report.resolvedUsername} label="Copy username" />
                </span>
              </Fact>
            )}
            {report.resolvedPassword && (
              <Fact label="Password">
                <span className="flex items-center gap-1">
                  <code className="truncate font-mono text-xs">{report.resolvedPassword}</code>
                  <CopyButton value={report.resolvedPassword} label="Copy password" />
                </span>
              </Fact>
            )}
            <div className="col-span-2">
              <Fact label="Reported key">
                <span className="flex items-center gap-1">
                  <code className="break-all font-mono text-xs">{report.resolvedCdKey ?? report.storageKey}</code>
                  <CopyButton value={report.resolvedCdKey ?? report.storageKey} label="Copy key" />
                  {!report.keyId && <Chip tone="gray">Removed from program</Chip>}
                </span>
              </Fact>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-x-4 text-xs">
            {report.programId && (
              <Link href={`/admin/programs?edit=${report.programId}`} className="text-sky-700 hover:underline dark:text-sky-300">
                Edit program
              </Link>
            )}
            <Link href={`/program/${report.programSlug}`} target="_blank" className="text-sky-700 hover:underline dark:text-sky-300">
              Public page
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="grid grid-cols-4 gap-2">
            <Count label="Reports" value={report.reportCount} />
            <Count label="Working" value={data.working} />
            <Count label="Expired" value={data.expired} />
            <Count label="Limit" value={data.limit_reached} />
          </div>
          {counted > 0 && (
            <div className="mt-3">
              <ReportProgressBar reportData={data} />
            </div>
          )}
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
            <Fact label="First report">{shortDate(report.firstReported)}</Fact>
            <Fact label="Top countries">
              <span className="block truncate">{countries.map(([c, n]) => `${c} ${n}`).join(", ") || "—"}</span>
            </Fact>
          </dl>
          {triedVersions.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Tried on another version ({data.otherVersion} {data.otherVersion === 1 ? "report" : "reports"}, not in the bar)
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {triedVersions.map(([version, count]) => (
                  <span key={version} className="rounded border border-gray-200 px-1.5 text-[11px] tabular-nums text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    v{version} ×{count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {suggestion && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-amber-900 dark:text-amber-200">
            Reports point to <strong>{statusLabel(suggestion)}</strong>, but this key is {statusLabel(report.status)}.
          </p>
          <button
            type="button"
            disabled={savingStatus || !report.keyId}
            onClick={() => onSetStatus(suggestion)}
            className="cursor-pointer rounded-md bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50">
            Set to {statusLabel(suggestion)}
          </button>
        </div>
      )}

      <section className="mt-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter reports">
            {filters.map(f => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => {
                  setFilter(f.value);
                  setLimit(PAGE_SIZE);
                }}
                className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filter === f.value
                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                    : "bg-gray-100 text-gray-600 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
                }`}>
                {f.label} <span className="tabular-nums opacity-70">{filterCounts[f.value]}</span>
              </button>
            ))}
          </div>
          <AdminSearch value={search} onChange={setSearch} placeholder="Search location, version, referrer…" className="ml-auto min-w-52 flex-1 sm:max-w-64" />
        </div>

        {error && (
          <p role="alert" className="mb-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="sticky -top-5 z-10 flex rounded-t-xl min-h-11 flex-wrap items-center gap-x-3 gap-y-1 border-b border-gray-200 bg-gray-50 px-3 py-1.5 text-xs dark:border-gray-800 dark:bg-gray-800">
            <label className="flex cursor-pointer items-center gap-3 text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => {
                  if (el) el.indeterminate = selectedIds.length > 0 && !allSelected;
                }}
                onChange={() => setSelected(allSelected ? new Set() : new Set(filtered.map(r => r._id)))}
                className="h-4 w-4 cursor-pointer rounded"
              />
              {selectedIds.length
                ? `${selectedIds.length} of ${filtered.length} selected`
                : `Select all ${filtered.length.toLocaleString()}`}
            </label>
            {selectedIds.length > 0 && (
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                {bulkSaving && <FaSpinner className="h-3 w-3 animate-spin text-gray-400" aria-label="Saving" />}
                <span className="text-gray-500 dark:text-gray-400">Change to</span>
                {REPORT_EVENT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={bulkSaving}
                    onClick={() => void applyBulk(option.value)}
                    className="cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 font-medium text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-700">
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No reports match these filters.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.slice(0, limit).map(row => (
                <KeyReportRow
                  key={row._id}
                  row={row}
                  visitor={row.ipHash ? visitors[row.ipHash] : undefined}
                  repeatCount={row.ipHash ? (repeats.get(row.ipHash) ?? 1) : 1}
                  selected={selected.has(row._id)}
                  saving={savingRows.has(row._id)}
                  onToggle={toggleRow}
                  onSetEvent={setOneEvent}
                  onSetTriedVersion={setVersion}
                  onSpammerChange={setSpammer}
                />
              ))}
            </ul>
          )}

          {filtered.length > limit && (
            <button
              type="button"
              onClick={() => setLimit(n => n + PAGE_SIZE)}
              className="w-full cursor-pointer border-t border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800/50">
              Show more ({(filtered.length - limit).toLocaleString()} left)
            </button>
          )}
        </div>
      </section>
    </AdminDetailsModal>
  );
}
