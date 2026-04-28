"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { KeyReport, KeyReportEvent } from "@/src/types";
import ModalSection from "./ModalSection";
import { ModalCloseButton } from "@/src/components/ui/ModalCloseButton";
import { FiAlertTriangle, FiCheck, FiX } from "react-icons/fi";
import { client } from "@/src/sanity/lib/client";
import { effectiveReferrerHref, extractReferrerInfo } from "@/src/lib/analytics/analyticsUtils";
import { visitorTierBadgeClasses } from "@/src/theme/colorSchema";
import {
  isAccountFlow,
  isKeyLikeFlow,
  isLinkAccountFlow,
  normalizeProgramFlow
} from "@/src/lib/program/activationEntry";

const EVENT_OPTIONS: { value: KeyReportEvent; label: string }[] = [
  { value: "report_key_working", label: "Working" },
  { value: "report_key_expired", label: "Expired" },
  { value: "report_key_limit_reached", label: "Limit reached" }
];

const keyInfoCodeClass =
  "flex min-w-0 w-full max-w-full items-center text-sm font-mono bg-white text-gray-900 px-4 py-3 rounded-lg border border-blue-200 shadow-sm break-all";

function KeyInformationGrid({
  report,
  getStatusColor
}: {
  report: KeyReport;
  getStatusColor: (status: string) => string;
}) {
  const flow = normalizeProgramFlow(report.programFlow);
  const primaryLabel = isAccountFlow(flow)
    ? "Display label"
    : isLinkAccountFlow(flow)
      ? "Links (display)"
      : "CD key (display)";

  const rawResolvedCd = report.resolvedCdKey?.trim();
  const showProgramRowCdKey =
    isKeyLikeFlow(flow) &&
    !!rawResolvedCd &&
    rawResolvedCd !== report.key.trim() &&
    rawResolvedCd !== report.storageKey.trim();

  const username = report.resolvedUsername?.trim();
  const password = report.resolvedPassword?.trim();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="min-w-0">
        <label className="text-sm font-semibold text-blue-700 mb-2 block">{primaryLabel}</label>
        <code className={keyInfoCodeClass}>{report.key}</code>
      </div>
      <div>
        <label className="text-sm font-semibold text-blue-700 mb-2 block">Status</label>
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(report.status)}`}>
          {report.status}
        </span>
      </div>

      {showProgramRowCdKey ? (
        <div className="min-w-0 md:col-span-2">
          <label className="text-sm font-semibold text-blue-700 mb-2 block">CD key (program row)</label>
          <code className={keyInfoCodeClass}>{rawResolvedCd}</code>
        </div>
      ) : null}

      {username ? (
        <div className="min-w-0">
          <label className="text-sm font-semibold text-blue-700 mb-2 block">Username (program row)</label>
          <code className={keyInfoCodeClass}>{username}</code>
        </div>
      ) : null}
      {password ? (
        <div className="min-w-0">
          <label className="text-sm font-semibold text-blue-700 mb-2 block">Password (program row)</label>
          <code className={keyInfoCodeClass}>{password}</code>
        </div>
      ) : null}

      <div className="min-w-0 md:col-span-2">
        <label className="text-sm font-semibold text-blue-700 mb-2 block">Row storage key</label>
        <code className="block text-xs font-mono text-gray-600 bg-white px-3 py-2 rounded border border-blue-200 break-all">
          {report.storageKey}
        </code>
      </div>
    </div>
  );
}

interface ReportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: KeyReport | null;
}

export default function ReportDetailsModal({ isOpen, onClose, report }: ReportDetailsModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rowEventTypes, setRowEventTypes] = useState<Record<string, KeyReportEvent>>({});
  const [savingReportId, setSavingReportId] = useState<string | null>(null);
  const [spamBusyHash, setSpamBusyHash] = useState<string | null>(null);
  const [visitorByHash, setVisitorByHash] = useState<Record<string, { visitTier?: string; isSpammer?: boolean }>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!report) return;
    const next: Record<string, KeyReportEvent> = {};
    for (const r of report.reports) {
      if (r._id) next[r._id] = r.eventType;
    }
    setRowEventTypes(next);
  }, [report]);

  useEffect(() => {
    if (!report) return;
    const hashes = [...new Set(report.reports.map(r => r.ipHash).filter(Boolean))] as string[];
    if (hashes.length === 0) {
      setVisitorByHash({});
      return;
    }
    let cancelled = false;
    client
      .fetch<Array<{ visitorHash?: string; visitTier?: string; isSpammer?: boolean }>>(
        `*[_type=="visitor" && visitorHash in $hashes]{ visitorHash, visitTier, isSpammer }`,
        { hashes }
      )
      .then(rows => {
        if (cancelled) return;
        const m: Record<string, { visitTier?: string; isSpammer?: boolean }> = {};
        for (const r of rows ?? []) {
          if (r.visitorHash) m[r.visitorHash] = { visitTier: r.visitTier, isSpammer: r.isSpammer };
        }
        setVisitorByHash(m);
      })
      .catch(() => {
        if (!cancelled) setVisitorByHash({});
      });
    return () => {
      cancelled = true;
    };
  }, [report]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const saveReportEventType = useCallback(
    async (reportId: string) => {
      const eventType = rowEventTypes[reportId];
      if (!eventType) return;
      setSavingReportId(reportId);
      try {
        const res = await fetch("/api/v1/admin/key-report-event", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reportId, eventType })
        });
        if (!res.ok) {
          console.error("PATCH key-report-event", await res.text());
        }
      } finally {
        setSavingReportId(null);
      }
    },
    [rowEventTypes]
  );

  const patchVisitorSpam = useCallback(async (visitorHash: string, isSpammer: boolean) => {
    const ok = window.confirm(
      isSpammer
        ? "Mark this visitor as spammer? They can still report keys as working, but not expired or limit reached."
        : "Unmark spammer for this visitor?"
    );
    if (!ok) return;
    setSpamBusyHash(visitorHash);
    try {
      const res = await fetch("/api/v1/admin/visitor-spammer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ visitorHash, isSpammer })
      });
      if (res.ok) {
        setVisitorByHash(prev => ({
          ...prev,
          [visitorHash]: {
            visitTier: prev[visitorHash]?.visitTier ?? "new",
            isSpammer
          }
        }));
      } else console.error("PATCH visitor-spammer", await res.text());
    } finally {
      setSpamBusyHash(null);
    }
  }, []);

  if (!mounted || !isOpen || !report) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-primary-800 border border-blue-200";
      case "active":
        return "bg-green-100 text-green-800 border border-green-200";
      case "limit":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "expired":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const modalContent = (
    <div
      className={`fixed inset-0 z-9999 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none" />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-lg shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col transform transition-transform duration-300 ${
          isVisible ? "scale-100" : "scale-95"
        }`}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between py-2 px-6 border-b-2 border-blue-200 bg-white">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">Report Details</h2>
            <p className="text-primary-700 font-medium text-lg">{report.programTitle}</p>
          </div>
          <ModalCloseButton
            onClick={onClose}
            className="p-3 rounded-full text-gray-700 hover:text-gray-950 hover:bg-gray-100 active:bg-gray-200/80 transition-colors duration-200"
            iconClassName="h-7 w-7"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Key Information */}
          <ModalSection title="Key Information" color="blue">
            <KeyInformationGrid report={report} getStatusColor={getStatusColor} />
          </ModalSection>

          {/* Validity Information */}
          {(report.validFrom || report.validTo) && (
            <ModalSection title="Validity Period" color="green">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {report.validFrom && (
                  <div>
                    <label className="text-sm font-semibold text-green-700 mb-2 block">Valid From</label>
                    <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-green-200">
                      {new Date(report.validFrom).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {report.validTo && (
                  <div>
                    <label className="text-sm font-semibold text-green-700 mb-2 block">Valid Until</label>
                    <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-green-200">
                      {new Date(report.validTo).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </ModalSection>
          )}

          {/* Report Summary */}
          <ModalSection title="Report Summary" color="red">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center bg-white rounded-lg p-4 border border-red-200">
                <div className="text-2xl font-bold text-gray-800 mb-1">{report.reportCount}</div>
                <div className="text-xs font-semibold text-gray-900">Total Reports</div>
              </div>
              <div className="text-center bg-white rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-600 mb-1">{report.reportData.working}</div>
                <div className="text-xs font-semibold text-green-700">Working</div>
              </div>
              <div className="text-center bg-white rounded-lg p-4 border border-red-200">
                <div className="text-2xl font-bold text-red-600 mb-1">{report.reportData.expired}</div>
                <div className="text-xs font-semibold text-red-700">Expired</div>
              </div>
              <div className="text-center bg-white rounded-lg p-4 border border-orange-200">
                <div className="text-2xl font-bold text-orange-600 mb-1">{report.reportData.limit_reached}</div>
                <div className="text-xs font-semibold text-orange-700">Limit Reached</div>
              </div>
            </div>

            {/* Recommended Status */}
            {report.reportCount > 10 && report.reportData.working / report.reportCount <= 0.2 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <FiAlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <div>
                    <div className="text-sm font-semibold text-yellow-800">Recommended Status:</div>
                    <div className="text-sm text-yellow-700">
                      {report.reportData.expired >= report.reportData.limit_reached ? "Expired" : "Limit Reached"}
                      <span className="ml-1 text-xs">
                        (
                        {Math.round(
                          ((report.reportData.expired + report.reportData.limit_reached) / report.reportCount) * 100
                        )}
                        % of reports)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-sm text-gray-900 font-medium">{formatDate(report.firstReported)}</div>
                <div className="text-xs text-gray-600 font-semibold">First Reported</div>
              </div>
              <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-sm text-gray-900 font-medium">{formatDate(report.lastReported)}</div>
                <div className="text-xs text-gray-600 font-semibold">Last Reported</div>
              </div>
            </div>
          </ModalSection>

          {/* Individual Reports */}
          <ModalSection title={`Individual Reports (${report.reports.length})`} color="purple">
            <p className="text-xs text-gray-600 mb-3">
              Adjust stored type; spammer flag blocks new public reports for that visitor hash.
            </p>
            <div className="space-y-2">
              {report.reports.map((reportItem, index) => {
                const rid = reportItem._id || `row-${index}`;
                const currentSelect = rowEventTypes[rid] ?? reportItem.eventType;
                const eventTypeConfig = {
                  report_key_working: {
                    Icon: FiCheck,
                    label: "Working",
                    iconClass: "text-green-600",
                    rowClass: "bg-green-50/80 border-green-200"
                  },
                  report_key_expired: {
                    Icon: FiX,
                    label: "Expired",
                    iconClass: "text-red-600",
                    rowClass: "bg-red-50/80 border-red-200"
                  },
                  report_key_limit_reached: {
                    Icon: FiAlertTriangle,
                    label: "Limit Reached",
                    iconClass: "text-amber-600",
                    rowClass: "bg-amber-50/80 border-amber-200"
                  }
                };
                const config = eventTypeConfig[currentSelect as keyof typeof eventTypeConfig] ?? {
                  Icon: FiAlertTriangle,
                  label: currentSelect,
                  iconClass: "text-gray-500",
                  rowClass: "bg-gray-50 border-gray-200"
                };
                const hash = reportItem.ipHash?.trim();
                const hashShort = hash ? `${hash.slice(0, 14)}…` : "—";
                const v = hash ? visitorByHash[hash] : undefined;
                const tier = v?.visitTier ?? "new";
                const isSpam = v?.isSpammer === true;
                const ref = reportItem.referrer?.trim();

                return (
                  <div
                    key={rid}
                    className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 rounded-md border px-3 py-2 text-xs ${config.rowClass}`}>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="text-[11px] text-gray-600 font-medium">{formatDate(reportItem.createdAt)}</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <config.Icon className={`w-4 h-4 shrink-0 ${config.iconClass}`} />
                        <select
                          className="text-gray-900 border border-gray-300 rounded px-2 py-0.5 text-xs bg-white max-w-44 h-7"
                          value={currentSelect}
                          onChange={e =>
                            setRowEventTypes(prev => ({
                              ...prev,
                              [rid]: e.target.value as KeyReportEvent
                            }))
                          }>
                          {EVENT_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={
                            !reportItem._id ||
                            savingReportId === reportItem._id ||
                            currentSelect === reportItem.eventType
                          }
                          onClick={() => reportItem._id && void saveReportEventType(reportItem._id)}
                          className="h-7 px-2 rounded bg-indigo-600 text-white text-xs disabled:opacity-40 disabled:cursor-not-allowed">
                          {savingReportId === reportItem._id ? "Saving…" : "Save"}
                        </button>
                      </div>
                      {ref ? (
                        <div className="text-[10px] text-gray-600 truncate" title={ref}>
                          <span className="font-semibold text-gray-700">Referrer:</span>{" "}
                          <a
                            href={effectiveReferrerHref(ref)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline">
                            {extractReferrerInfo(ref).hostname}
                          </a>
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-400">Referrer: —</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 sm:items-end sm:text-right text-xs text-gray-600 shrink-0">
                      <div className="flex flex-wrap items-center justify-end gap-1.5 w-full sm:max-w-[20rem]">
                        <span className={visitorTierBadgeClasses(tier, false)}>{tier}</span>
                        {isSpam ? <span className={visitorTierBadgeClasses("new", true)}>spammer</span> : null}
                        <span className="font-mono text-[10px] text-gray-500 break-all text-right min-w-0" title={hash}>
                          {hashShort}
                        </span>
                      </div>
                      <span className="max-w-72" title={`${reportItem.city}, ${reportItem.country}`}>
                        {reportItem.city}, {reportItem.country}
                      </span>
                      {hash ? (
                        <button
                          type="button"
                          disabled={spamBusyHash === hash}
                          onClick={() => void patchVisitorSpam(hash, !isSpam)}
                          className={`h-7 px-2.5 rounded border text-xs font-medium transition-colors disabled:opacity-50 ${
                            isSpam
                              ? "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                              : "border-red-300 bg-red-50 text-red-800 hover:bg-red-100"
                          }`}>
                          {spamBusyHash === hash ? "…" : isSpam ? "Unmark spammer" : "Mark spammer"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </ModalSection>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between py-2 px-6 border-t-2 border-blue-200 bg-linear-to-r from-blue-50 to-indigo-50 shadow-lg">
          <div className="text-sm text-gray-600 font-medium">
            {report.reportCount} total reports • Last updated: {new Date(report.lastReported).toLocaleDateString()}
          </div>
          <ModalCloseButton
            onClick={onClose}
            className="px-8 py-3 text-base font-bold text-white bg-blue-600 border-2 border-blue-600 rounded-xl hover:bg-blue-700 hover:border-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:ring-offset-2">
            Close
          </ModalCloseButton>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
