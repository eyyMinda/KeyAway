"use client";

import { useState, useEffect } from "react";
import { client } from "@/src/sanity/lib/client";
import { keyReportsQuery, allProgramsQuery } from "@/src/lib/queries";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import ReportDetailsModal from "@/src/components/admin/ReportDetailsModal";
import KeyReportsTable from "@/src/components/admin/key-reports/KeyReportsTable";
import { Program, ExpiredKeyReport } from "@/src/types";
import { hashCDKey } from "@/src/lib/keyHashing";
import { logger } from "@/src/lib/logger";
import { useStatusChange } from "@/src/hooks/useStatusChange";

export default function KeyReportsPage() {
  const [reports, setReports] = useState<ExpiredKeyReport[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<ExpiredKeyReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use custom hook for status change management
  const { pendingChanges, saving, handleStatusChange, saveStatusChange, cancelStatusChange } = useStatusChange({
    programs,
    setReports,
    setPrograms
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch programs
        const programsData: Program[] = await client.fetch(allProgramsQuery);
        setPrograms(programsData);

        // Fetch key reports from last 30 days
        // const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
        // Fetch all historical key reports
        const since = "1970-01-01T00:00:00.000Z";
        const events = await client.fetch(keyReportsQuery, { since });

        // Debug: Log a sample event to see the data structure
        if (events.length > 0) {
          logger.collapse(events[0], "Sample tracking event data", "info");
        }

        // All events are key reports from keyReportsQuery
        const keyReportEvents = events;

        // Group by actual CD key within each program using hash matching
        const keyReports = new Map<string, ExpiredKeyReport>();

        for (const report of keyReportEvents) {
          const programSlug = (report.programSlug as string) || "unknown";
          const keyHash = (report.keyHash as string) || "unknown";
          const keyIdentifier = (report.keyIdentifier as string) || "unknown";
          const program = programsData.find(p => p.slug?.current === programSlug);

          // Find the actual CD key from the program by matching hash
          let actualKey = null;
          if (program?.cdKeys) {
            actualKey = program.cdKeys.find(k => {
              const keyHashFromProgram = hashCDKey(k.key);
              return keyHashFromProgram === keyHash;
            });

            if (!actualKey) {
              logger.collapse(
                `No matching CD key found for keyHash: ${keyHash} in program: ${program?.title}`,
                "Missing CD Key",
                "warning"
              );
            }
          }

          // Use the actual key for grouping, or fallback to hash if not found
          const keyForGrouping = actualKey?.key || keyHash;
          const groupKey = `${programSlug}:${keyForGrouping}`;

          if (!keyReports.has(groupKey)) {
            const newReport = {
              key: actualKey?.key || "Unknown Key",
              keyHash: keyHash,
              keyIdentifier: keyIdentifier,
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

          // Update report data based on event type
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
            createdAt: report.createdAt as string,
            country: (report.country as string) || "Unknown",
            city: (report.city as string) || "Unknown",
            eventType: eventType as "report_key_working" | "report_key_expired" | "report_key_limit_reached"
          });

          // Update first and last reported dates
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

  const filteredReports =
    selectedProgram === "all"
      ? reports
      : reports.filter(report => {
          // Match by slug or _id
          const program = programs.find(p => p.slug?.current === selectedProgram || p._id === selectedProgram);
          return program && report.programSlug === program.slug?.current;
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

        {/* Reports Table */}
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

      {/* Report Details Modal */}
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
