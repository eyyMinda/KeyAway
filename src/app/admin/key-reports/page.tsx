"use client";

/** @fileoverview Admin key reports: aggregate Sanity keyReport docs by program+key, filters, modal detail. */
import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { client } from "@/src/sanity/lib/client";
import { keyReportsQuery, allProgramsQuery } from "@/src/lib/sanity/queries";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import ReportDetailsModal from "@/src/components/admin/ReportDetailsModal";
import KeyReportsTable from "@/src/components/admin/key-reports/KeyReportsTable";
import type { CDKey, Program, ProgramFlow } from "@/src/types/program";
import { KeyReport } from "@/src/types";
import { getKeyData, normalizeKey } from "@/src/lib/keyHashing";
import {
  getActivationEntryDisplayLabel,
  getActivationEntryIdentityString,
  isAccountFlow,
  isKeyLikeFlow,
  isLinkAccountFlow,
  normalizeProgramFlow
} from "@/src/lib/program/activationEntry";
import { logger } from "@/src/lib/logger";
import { useStatusChange } from "@/src/hooks/useStatusChange";
import { I18nProvider } from "@/src/contexts/i18n";
import adminKeyReportsEn from "@/src/locales/admin/key-reports/en.json";

/** `?key=` filter: row storage is plaintext CD key, lowercase username, or link digest — not CD-key SHA. */
function keyQueryMatchesRowStorage(
  flow: ProgramFlow,
  storageKey: string,
  displayKey: string | undefined,
  raw: string
): boolean {
  const r = raw.trim();
  const sk = storageKey.trim();
  if (!r || !sk) return false;
  if (sk === r || sk.toLowerCase() === r.toLowerCase()) return true;
  if (isKeyLikeFlow(flow) && normalizeKey(sk) === normalizeKey(r)) return true;
  const dk = (displayKey ?? "").trim();
  if (dk && dk !== "Unknown Key" && dk !== "Unknown") {
    if (isKeyLikeFlow(flow) && normalizeKey(dk) === normalizeKey(r)) return true;
    if ((isAccountFlow(flow) || isLinkAccountFlow(flow)) && dk.toLowerCase() === r.toLowerCase()) return true;
  }
  return false;
}

function keyQueryMatchesActivationRow(flow: ProgramFlow, k: CDKey, raw: string): boolean {
  const kd = getKeyData({ ...(k as CDKey), programFlow: flow }, flow);
  if (!kd?.hash) return false;
  const r = raw.trim();
  if (kd.hash === r || kd.hash.toLowerCase() === r.toLowerCase()) return true;
  if (isKeyLikeFlow(flow) && normalizeKey(kd.hash) === normalizeKey(r)) return true;
  return false;
}

function KeyReportsPageContent() {
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<KeyReport[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<KeyReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasAppliedProgramParam = useRef(false);

  const { pendingChanges, saving, handleStatusChange, saveStatusChange, cancelStatusChange } = useStatusChange({
    programs,
    setReports,
    setPrograms
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const programsData: Program[] = await client.fetch(allProgramsQuery);
        setPrograms(programsData);

        const since = "1970-01-01T00:00:00.000Z";
        const events = await client.fetch(keyReportsQuery, { since });

        const keyReportEvents = events;
        const keyReports = new Map<string, KeyReport>();

        for (const report of keyReportEvents) {
          const programSlug = (report.programSlug as string) || "unknown";
          const storageKey = String((report as { key?: string }).key ?? "").trim() || "unknown";
          const storedLabel = String((report as { label?: string }).label ?? "").trim() || "unknown";
          const program = programsData.find(p => p.slug?.current === programSlug);

          let actualKey: CDKey | null = null;
          const flow = normalizeProgramFlow(program?.programFlow);
          if (program?.cdKeys) {
            actualKey =
              program.cdKeys.find(
                k => getKeyData({ ...(k as CDKey), programFlow: flow }, flow)?.hash === storageKey
              ) ?? null;

            if (!actualKey) {
              logger.collapse(
                `No matching activation row for storage key: ${storageKey} in program: ${program?.title}`,
                "Missing activation row",
                "warning"
              );
            }
          }

          const groupKey = `${programSlug}:${storageKey}`;

          if (!keyReports.has(groupKey)) {
            const display =
              actualKey != null
                ? getActivationEntryDisplayLabel(actualKey, flow)
                : storedLabel !== "unknown"
                  ? storedLabel
                  : "Unknown";

            let resolvedUsername: string | undefined;
            let resolvedPassword: string | undefined;
            let resolvedCdKey: string | undefined;
            if (actualKey) {
              if (isAccountFlow(flow)) {
                const u = (actualKey.username ?? "").trim();
                const p = (actualKey.password ?? "").trim();
                if (u) resolvedUsername = u;
                if (p) resolvedPassword = p;
              } else if (isKeyLikeFlow(flow)) {
                const k = (actualKey.key ?? "").trim();
                if (k) resolvedCdKey = k;
              }
            }

            const newReport = {
              key: display,
              storageKey,
              programFlow: flow,
              ...(resolvedUsername ? { resolvedUsername } : {}),
              ...(resolvedPassword ? { resolvedPassword } : {}),
              ...(resolvedCdKey ? { resolvedCdKey } : {}),
              programSlug,
              programTitle: program?.title || "Unknown Program",
              reportCount: 0,
              firstReported: report.createdAt as string,
              lastReported: report.createdAt as string,
              status: actualKey?.status || "active",
              validFrom: actualKey?.validFrom,
              validTo: actualKey?.validUntil,
              reportData: {
                working: 0,
                expired: 0,
                limit_reached: 0
              },
              reports: []
            };

            keyReports.set(groupKey, newReport);
          }

          const keyReport = keyReports.get(groupKey)!;

          const eventType = report.eventType as string;

          switch (eventType) {
            case "report_key_working":
              keyReport.reportData.working++;
              break;
            case "report_key_expired":
              keyReport.reportData.expired++;
              break;
            case "report_key_limit_reached":
              keyReport.reportData.limit_reached++;
              break;
          }

          keyReport.reportCount++;
          keyReport.lastReported = report.createdAt as string;

          // Debug: Log the report data to see what's available
          logger.collapse(
            {
              country: report.country,
              city: report.city,
              createdAt: report.createdAt,
              programSlug: report.programSlug,
              eventType
            },
            "Processing report data",
            "info"
          );

          keyReport.reports.push({
            _id: report._id as string,
            ipHash: (report.ipHash as string) || undefined,
            referrer: (report.referrer as string) || undefined,
            createdAt: report.createdAt as string,
            country: (report.country as string) || "Unknown",
            city: (report.city as string) || "Unknown",
            eventType: eventType as "report_key_working" | "report_key_expired" | "report_key_limit_reached"
          });

          if (new Date(report.createdAt as string) < new Date(keyReport.firstReported)) {
            keyReport.firstReported = report.createdAt as string;
          }
          if (new Date(report.createdAt as string) > new Date(keyReport.lastReported)) {
            keyReport.lastReported = report.createdAt as string;
          }
        }

        const finalReports = Array.from(keyReports.values()).sort((a, b) => b.reportCount - a.reportCount);
        setReports(finalReports);
        logger.collapse(`Loaded ${finalReports.length} key reports`, "Reports Loaded", "success");
      } catch (error) {
        logger.collapse(error, "Error fetching key reports", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const programSlug = searchParams.get("program");
    const keyParam = searchParams.get("key");
    const raw = keyParam?.trim() ?? "";

    if (programs.length === 0) return;

    if (programSlug) {
      const valid = programs.some(p => p.slug?.current === programSlug);
      if (valid && !hasAppliedProgramParam.current) {
        setSelectedProgram(programSlug);
        hasAppliedProgramParam.current = true;
      }
      return;
    }

    if (!raw) return;

    for (const p of programs) {
      const flow = normalizeProgramFlow(p.programFlow);
      for (const k of p.cdKeys ?? []) {
        const id = getActivationEntryIdentityString(k as CDKey, flow);
        if (id && isKeyLikeFlow(flow) && normalizeKey(id) === normalizeKey(raw)) {
          setSelectedProgram(p.slug?.current || "all");
          return;
        }
        if (keyQueryMatchesActivationRow(flow, k as CDKey, raw)) {
          setSelectedProgram(p.slug?.current || "all");
          return;
        }
      }
    }
  }, [programs, searchParams]);

  const keyParam = searchParams.get("key");

  const filteredReports = reports.filter(report => {
    if (selectedProgram !== "all") {
      const program = programs.find(p => p.slug?.current === selectedProgram || p._id === selectedProgram);
      if (!program || report.programSlug !== program.slug?.current) return false;
    }
    if (keyParam) {
      const prog = programs.find(p => p.slug?.current === report.programSlug);
      const flow = normalizeProgramFlow(prog?.programFlow);
      if (!keyQueryMatchesRowStorage(flow, report.storageKey, report.key, keyParam)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <ProtectedAdminLayout title="Key Reports" subtitle="Manage all CD key reports (working, expired, limit reached)">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading key reports...</p>
          </div>
        </div>
      </ProtectedAdminLayout>
    );
  }

  return (
    <ProtectedAdminLayout title="Key Reports" subtitle="Manage all CD key reports (working, expired, limit reached)">
      <div className="space-y-6">
        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            <label htmlFor="program-filter" className="text-sm font-medium text-gray-700">
              Filter by Program:
            </label>
            <select
              id="program-filter"
              value={selectedProgram}
              onChange={e => setSelectedProgram(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
              <option key="all" value="all">
                All Programs
              </option>
              {programs.map((program, index) => (
                <option key={`program-${program._id}-${index}`} value={program.slug?.current || program._id}>
                  {program.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <KeyReportsTable
            reports={filteredReports}
            pendingChanges={pendingChanges}
            saving={saving}
            onStatusChange={handleStatusChange}
            onSaveStatusChange={saveStatusChange}
            onCancelStatusChange={cancelStatusChange}
            onViewDetails={report => {
              setSelectedReport(report);
              setIsModalOpen(true);
            }}
          />
        </div>
      </div>

      <ReportDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
      />
    </ProtectedAdminLayout>
  );
}

const KeyReportsFallback = () => (
  <ProtectedAdminLayout title="Key Reports" subtitle="Manage all CD key reports (working, expired, limit reached)">
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading key reports...</p>
      </div>
    </div>
  </ProtectedAdminLayout>
);

export default function KeyReportsPage() {
  return (
    <I18nProvider locale="en" messages={{ adminKeyReports: adminKeyReportsEn }}>
      <Suspense fallback={<KeyReportsFallback />}>
        <KeyReportsPageContent />
      </Suspense>
    </I18nProvider>
  );
}
