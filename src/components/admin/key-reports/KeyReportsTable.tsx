"use client";

/** @fileoverview Reported keys: headline counts, filters, rows with inline status, and a floating bulk status bar. */
import { useMemo, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import AnalyticsCard from "@/src/components/admin/AnalyticsCard";
import {
  AdminEmptyRows,
  AdminFilterBar,
  AdminListCard,
  AdminPagination,
  AdminSearch,
  AdminSelect,
  Chip,
  RelativeDate,
  StatusPill,
  adminRow,
  adminTd,
  adminTh,
  adminTheadRow,
  programOptions,
  usePagedList
} from "@/src/components/admin/list/AdminListKit";
import ReportProgressBar from "@/src/components/program/cdkeys/ReportProgressBar";
import {
  CopyButton,
  KEY_STATUS_OPTIONS,
  KEY_STATUS_TONES,
  VersionTag,
  statusLabel
} from "@/src/components/admin/key-reports/keyReportUi";
import { isKeyVersionBehind, keyReportId, suggestedKeyStatus } from "@/src/lib/admin/keyReportGroups";
import { DAY_MS } from "@/src/lib/time";
import type { KeyReport } from "@/src/types/admin";
import type { CDKeyStatus } from "@/src/types/program";

type ReviewFilter = "all" | "review" | "outdated" | "other";
type SortKey = "recent" | "reports" | "worst" | "program";

type KeyReportsTableProps = {
  reports: KeyReport[];
  initialProgram: string;
  loadedAt: number;
  savingKeys: Set<string>;
  onSetStatus: (targets: KeyReport[], status: CDKeyStatus) => Promise<void>;
  onOpen: (report: KeyReport) => void;
};

const workingShare = ({ reportData: { working, expired, limit_reached } }: KeyReport) => {
  const total = working + expired + limit_reached;
  return total ? working / total : 1;
};

export default function KeyReportsTable({ reports, initialProgram, loadedAt, savingKeys, onSetStatus, onOpen }: KeyReportsTableProps) {
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [review, setReview] = useState<ReviewFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const program = programFilter ?? initialProgram;

  const stats = useMemo(() => {
    const weekAgo = loadedAt - 7 * DAY_MS;
    let lastWeek = 0;
    let working = 0;
    let counted = 0;
    for (const r of reports) {
      for (const row of r.reports) if (new Date(row.createdAt).getTime() >= weekAgo) lastWeek++;
      working += r.reportData.working;
      counted += r.reportData.working + r.reportData.expired + r.reportData.limit_reached;
    }
    return {
      lastWeek,
      working,
      counted,
      review: reports.filter(suggestedKeyStatus).length,
      outdated: reports.filter(isKeyVersionBehind).length
    };
  }, [reports, loadedAt]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = reports.filter(r => {
      if (program !== "all" && r.programSlug !== program) return false;
      if (status !== "all" && r.status !== status) return false;
      if (review === "review" && !suggestedKeyStatus(r)) return false;
      if (review === "outdated" && !isKeyVersionBehind(r)) return false;
      if (review === "other" && r.reportData.otherVersion === 0) return false;
      return !q || [r.programTitle, r.key, r.storageKey, r.keyVersion].some(v => v?.toLowerCase().includes(q));
    });
    return list.sort((a, b) => {
      if (sort === "reports") return b.reportCount - a.reportCount;
      if (sort === "worst") return workingShare(a) - workingShare(b) || b.reportCount - a.reportCount;
      if (sort === "program") return a.programTitle.localeCompare(b.programTitle);
      return b.lastReported.localeCompare(a.lastReported);
    });
  }, [reports, search, program, status, review, sort]);

  const paged = usePagedList(filtered, `${search}|${program}|${status}|${review}|${sort}`);

  const selectable = filtered.filter(r => r.keyId);
  const selectedReports = reports.filter(r => selected.has(keyReportId(r)));
  const allSelected = selectable.length > 0 && selectable.every(r => selected.has(keyReportId(r)));
  const someSelected = selectedReports.length > 0;
  const bulkSaving = selectedReports.some(r => savingKeys.has(keyReportId(r)));

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const applyBulk = async (next: CDKeyStatus) => {
    await onSetStatus(selectedReports, next);
    setSelected(new Set());
  };

  const showReview = (value: ReviewFilter) => setReview(current => (current === value ? "all" : value));

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <AnalyticsCard
          label="Reported keys"
          value={reports.length}
          detail={`${reports.reduce((n, r) => n + r.reportCount, 0).toLocaleString()} reports in total`}
        />
        <button type="button" onClick={() => showReview("review")} className="cursor-pointer text-left" aria-pressed={review === "review"}>
          <AnalyticsCard label="Needs review" value={stats.review} detail="Reports disagree with the status" />
        </button>
        <AnalyticsCard label="Reports, last 7 days" value={stats.lastWeek} />
        <AnalyticsCard
          label="Reported working"
          value={stats.working}
          detail={stats.counted ? `${Math.round((stats.working / stats.counted) * 100)}% of ${stats.counted.toLocaleString()} reports` : undefined}
        />
      </div>

      <AdminFilterBar>
        <AdminSearch value={search} onChange={setSearch} placeholder="Search program, key or version…" className="sm:min-w-64 sm:flex-1" />
        <AdminSelect
          label="Program"
          value={program}
          onChange={setProgramFilter}
          options={programOptions(reports.map(r => ({ key: r.programSlug, label: r.programTitle })))}
          className="sm:max-w-64"
        />
        <AdminSelect
          label="Key status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All statuses" },
            ...KEY_STATUS_OPTIONS.map(o => ({ ...o, count: reports.filter(r => r.status === o.value).length }))
          ]}
        />
        <AdminSelect
          label="Show"
          value={review}
          onChange={v => setReview(v as ReviewFilter)}
          options={[
            { value: "all", label: "All keys" },
            { value: "review", label: "Needs review", count: stats.review },
            { value: "outdated", label: "Older version", count: stats.outdated },
            { value: "other", label: "Tried on another version", count: reports.filter(r => r.reportData.otherVersion > 0).length }
          ]}
        />
        <AdminSelect
          label="Sort"
          value={sort}
          onChange={v => setSort(v as SortKey)}
          options={[
            { value: "recent", label: "Latest report" },
            { value: "reports", label: "Most reports" },
            { value: "worst", label: "Least working" },
            { value: "program", label: "Program A–Z" }
          ]}
        />
      </AdminFilterBar>

      <AdminListCard
        title="Keys"
        meta={`${filtered.length.toLocaleString()} ${filtered.length === 1 ? "key" : "keys"}`}
        footer={
          filtered.length > 0 && (
            <AdminPagination
              page={paged.page}
              totalPages={paged.totalPages}
              total={filtered.length}
              pageSize={paged.pageSize}
              onPageChange={paged.setPage}
            />
          )
        }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={adminTheadRow}>
              <tr>
                <th className={`${adminTh} w-10`}>
                  <input
                    type="checkbox"
                    aria-label="Select all keys in this list"
                    checked={allSelected}
                    ref={el => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(selectable.map(keyReportId)))}
                    className="h-4 w-4 cursor-pointer rounded"
                  />
                </th>
                <th className={adminTh}>Key</th>
                <th className={adminTh}>Status</th>
                <th className={`${adminTh} min-w-52`}>Reports</th>
                <th className={adminTh}>Last report</th>
                <th className={adminTh} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paged.pageItems.length === 0 ? (
                <AdminEmptyRows colSpan={6}>No reported keys match these filters.</AdminEmptyRows>
              ) : (
                paged.pageItems.map(report => {
                  const id = keyReportId(report);
                  const saving = savingKeys.has(id);
                  const suggestion = suggestedKeyStatus(report);
                  const behind = isKeyVersionBehind(report);
                  return (
                    <tr key={id} className={`${adminRow} ${selected.has(id) ? "bg-sky-50/70 dark:bg-sky-500/5" : ""}`}>
                      <td className={adminTd}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${report.key}`}
                          checked={selected.has(id)}
                          disabled={!report.keyId}
                          onChange={() => toggle(id)}
                          className="h-4 w-4 cursor-pointer rounded disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className={`${adminTd} max-w-xs`}>
                        <p className="truncate font-medium text-gray-900 dark:text-gray-100">{report.programTitle}</p>
                        <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                          <code className="truncate font-mono text-xs text-gray-600 dark:text-gray-400" title={report.key}>
                            {report.key}
                          </code>
                          <CopyButton value={report.resolvedCdKey ?? report.key} label="Copy key" />
                          <VersionTag version={report.keyVersion} behind={behind} />
                          {!report.keyId && <Chip tone="gray">Removed</Chip>}
                        </div>
                      </td>
                      <td className={adminTd}>
                        <div className="flex items-center gap-1.5">
                          <StatusPill
                            value={report.status}
                            options={KEY_STATUS_OPTIONS}
                            tones={KEY_STATUS_TONES}
                            disabled={saving || !report.keyId}
                            onChange={next => void onSetStatus([report], next)}
                          />
                          {saving && <FaSpinner className="h-3 w-3 animate-spin text-gray-400" aria-label="Saving" />}
                        </div>
                        {suggestion && (
                          <button
                            type="button"
                            disabled={saving || !report.keyId}
                            onClick={() => void onSetStatus([report], suggestion)}
                            title="Apply what the reports suggest"
                            className="mt-1 block cursor-pointer text-[11px] font-medium text-amber-700 hover:underline disabled:cursor-not-allowed dark:text-amber-300">
                            Set to {statusLabel(suggestion)} →
                          </button>
                        )}
                      </td>
                      <td className={adminTd}>
                        <ReportProgressBar reportData={report.reportData} />
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                          {report.reportCount.toLocaleString()} {report.reportCount === 1 ? "report" : "reports"}
                          {report.reportData.otherVersion > 0 && ` · ${report.reportData.otherVersion} on another version`}
                        </p>
                      </td>
                      <td className={`${adminTd} text-xs text-gray-500 dark:text-gray-400`}>
                        <RelativeDate iso={report.lastReported} />
                      </td>
                      <td className={`${adminTd} text-right`}>
                        <button
                          type="button"
                          onClick={() => onOpen(report)}
                          className="cursor-pointer rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AdminListCard>

      {someSelected && (
        <div className="sticky bottom-4 z-20 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-900 px-4 py-2.5 text-sm text-white shadow-xl dark:bg-gray-700">
          <span className="font-medium">
            {selectedReports.length} {selectedReports.length === 1 ? "key" : "keys"} selected
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-gray-300">Set status</span>
            {KEY_STATUS_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                disabled={bulkSaving}
                onClick={() => void applyBulk(option.value)}
                className="cursor-pointer rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50">
                {option.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-1 cursor-pointer rounded-md px-2 py-1 text-xs text-gray-300 hover:text-white">
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
