import React from "react";
import { ExpiredKeyReport } from "@/src/types/admin";
import { CDKeyStatus } from "@/src/types/program";
import ReportProgressBar from "@/src/components/program/cdkeys/ReportProgressBar";

interface ExpiredKeysTableProps {
  reports: ExpiredKeyReport[];
  pendingChanges: Map<string, { originalStatus: CDKeyStatus; newStatus: CDKeyStatus }>;
  saving: Set<string>;
  onStatusChange: (report: ExpiredKeyReport, newStatus: CDKeyStatus) => void;
  onSaveStatusChange: (report: ExpiredKeyReport) => void;
  onCancelStatusChange: (report: ExpiredKeyReport) => void;
  onViewDetails: (report: ExpiredKeyReport) => void;
}

const STATUS_OPTIONS: Record<CDKeyStatus, string> = {
  new: "New",
  active: "Active",
  expired: "Expired",
  limit: "Limit Reached"
};

export default function ExpiredKeysTable({
  reports,
  pendingChanges,
  saving,
  onStatusChange,
  onSaveStatusChange,
  onCancelStatusChange,
  onViewDetails
}: ExpiredKeysTableProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No expired key reports found</div>
        <div className="text-gray-400 text-sm mt-2">Reports will appear here when users report expired keys</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Report Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Report
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reports.map((report, index) => {
            const reportKey = `${report.programSlug}:${report.key}`;
            const hasChanges = pendingChanges.has(reportKey);
            const isSaving = saving.has(reportKey);
            const change = pendingChanges.get(reportKey);

            return (
              <tr key={`${report.programSlug}-${report.key}-${index}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.programSlug}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{report.key}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    <select
                      value={change ? change.newStatus : report.status}
                      onChange={e => onStatusChange(report, e.target.value as CDKeyStatus)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                      {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {hasChanges && change && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onSaveStatusChange(report)}
                          disabled={isSaving}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                          {isSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => onCancelStatusChange(report)}
                          disabled={isSaving}
                          className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ReportProgressBar reportData={report.reportData} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {report.reports.length > 0 ? new Date(report.reports[0].createdAt).toLocaleDateString() : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onViewDetails(report)}
                    className="text-blue-600 hover:text-blue-900 cursor-pointer">
                    View Details
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
