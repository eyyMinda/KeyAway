"use client";

import { useState, useEffect } from "react";
import { client } from "@/src/sanity/lib/client";
import { trackingEventsQuery, allProgramsQuery } from "@/src/lib/queries";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import { Program, ExpiredKeyReport, CDKeyStatus } from "@/src/types";

const STATUS_OPTIONS = {
  new: "New",
  active: "Active",
  limit: "Limit Reached",
  expired: "Expired"
} as const;

export default function ExpiredKeysPage() {
  const [reports, setReports] = useState<ExpiredKeyReport[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch programs
        const programsData: Program[] = await client.fetch(allProgramsQuery);
        console.log(
          "Fetched programs:",
          programsData.map(p => ({ id: p._id, title: p.title, slug: p.slug?.current }))
        );
        setPrograms(programsData);

        // Fetch expired key reports from last 30 days
        const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
        const events = await client.fetch(trackingEventsQuery, { since });

        // Filter for expired key reports
        const expiredReports = events.filter(
          (event: Record<string, unknown>) => event.event === "report_expired_cdkey"
        );

        // Group by key and program
        const keyReports = new Map<string, ExpiredKeyReport>();

        for (const report of expiredReports) {
          const key = (report.keyMasked as string) || "unknown";
          const programSlug = (report.programSlug as string) || "unknown";
          const program = programsData.find(p => p.slug?.current === programSlug);

          if (!keyReports.has(key)) {
            keyReports.set(key, {
              key: (report.keyMasked as string) || "unknown",
              keyMasked: (report.keyMasked as string) || "unknown",
              programSlug,
              programTitle: program?.title || "Unknown Program",
              reportCount: 0,
              firstReported: report.createdAt as string,
              lastReported: report.createdAt as string,
              status: "active" as const, // Default status, will be updated from program data
              validFrom: undefined,
              validTo: undefined,
              reports: []
            });
          }

          const keyReport = keyReports.get(key)!;
          keyReport.reportCount++;
          keyReport.reports.push({
            createdAt: report.createdAt as string,
            country: report.country as string,
            city: report.city as string
          });

          // Update first and last reported dates
          if (new Date(report.createdAt as string) < new Date(keyReport.firstReported)) {
            keyReport.firstReported = report.createdAt as string;
          }
          if (new Date(report.createdAt as string) > new Date(keyReport.lastReported)) {
            keyReport.lastReported = report.createdAt as string;
          }
        }

        // Get actual key data from programs to set status and validity
        for (const [, report] of keyReports) {
          const program = programsData.find(p => p.slug?.current === report.programSlug);
          if (program?.cdKeys) {
            const actualKey = program.cdKeys.find(k => k.key === report.key);
            if (actualKey) {
              report.status = actualKey.status;
              report.validFrom = actualKey.validFrom;
              report.validTo = actualKey.validUntil;
            }
          }
        }

        setReports(Array.from(keyReports.values()).sort((a, b) => b.reportCount - a.reportCount));
      } catch (error) {
        console.error("Error fetching expired key reports:", error);
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

  const updateKeyStatus = async (key: string, newStatus: CDKeyStatus) => {
    try {
      // Find the program that contains this key
      const program = programs.find(p => p.cdKeys?.some(k => k.key === key));

      if (!program) {
        console.error("Program not found for key:", key);
        return;
      }

      // Update the key status in the program
      const updatedKeys = program.cdKeys?.map(k => (k.key === key ? { ...k, status: newStatus } : k)) || [];

      // Update the program in Sanity
      await client.patch(program._id).set({ cdKeys: updatedKeys }).commit();

      // Update local state
      setReports(prev => prev.map(report => (report.key === key ? { ...report, status: newStatus } : report)));

      console.log(`Updated key ${key} status to ${newStatus}`);
    } catch (error) {
      console.error("Error updating key status:", error);
    }
  };

  if (loading) {
    return (
      <ProtectedAdminLayout title="Expired Key Reports" subtitle="Manage reported expired CD keys">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading expired key reports...</p>
          </div>
        </div>
      </ProtectedAdminLayout>
    );
  }

  return (
    <ProtectedAdminLayout title="Expired Key Reports" subtitle="Manage reported expired CD keys">
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
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option key="all" value="all">
                All Programs
              </option>
              {programs.map((program, index) => (
                <option
                  key={`program-${program._id}-${index}`}
                  value={program.slug?.current || program._id}
                  data-key={program._id}
                  data-slug={program.slug?.current}>
                  {program.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CD Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reports
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First Reported
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Reported
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{report.keyMasked}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.programTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {report.reportCount} reports
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={report.status}
                        onChange={e => updateKeyStatus(report.key, e.target.value as CDKeyStatus)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.validFrom && report.validTo ? (
                        <div>
                          <div className="text-xs">From: {new Date(report.validFrom).toLocaleDateString()}</div>
                          <div className="text-xs">To: {new Date(report.validTo).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No validity info</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.firstReported).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.lastReported).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => {
                          // Show detailed reports
                          console.log("Detailed reports for key:", report.key, report.reports);
                        }}
                        className="text-blue-600 hover:text-blue-900">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No expired key reports found</div>
            <div className="text-gray-500 text-sm">
              {selectedProgram === "all"
                ? "No keys have been reported as expired in the last 30 days."
                : "No keys have been reported as expired for this program."}
            </div>
          </div>
        )}
      </div>
    </ProtectedAdminLayout>
  );
}
