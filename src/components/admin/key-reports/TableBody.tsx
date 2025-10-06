import React from "react";
import { CDKeyStatus } from "@/src/types/program";
import { ExpiredKeyReport } from "@/src/types/admin";
import ReportProgressBar from "@/src/components/program/cdkeys/ReportProgressBar";
import { formatSlugToTitle } from "@/src/lib/programUtils";

interface TableBodyProps {
  reports: ExpiredKeyReport[];
  pendingChanges: Map<string, { originalStatus: CDKeyStatus; newStatus: CDKeyStatus }>;
  saving: Set<string>;
  onStatusChange: (report: ExpiredKeyReport, newStatus: CDKeyStatus) => void;
  onSaveStatusChange: (report: ExpiredKeyReport) => void;
  onCancelStatusChange: (report: ExpiredKeyReport) => void;
  onViewDetails: (report: ExpiredKeyReport) => void;
  getLatestReportTs: (r: ExpiredKeyReport) => number;
}

const STATUS_OPTIONS: Record<CDKeyStatus, string> = {
  new: "New",
  active: "Active",
  expired: "Expired",
  limit: "Limit Reached"
};

export default function TableBody({
  reports,
  pendingChanges,
  saving,
  onStatusChange,
  onSaveStatusChange,
  onCancelStatusChange,
  onViewDetails,
  getLatestReportTs
}: TableBodyProps) {
  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {reports.map((report, index) => {
        const reportKey = `${report.programSlug}:${report.key}`;
        const hasChanges = pendingChanges.has(reportKey);
        const isSaving = saving.has(reportKey);
        const change = pendingChanges.get(reportKey);

        return (
          <tr key={`${report.programSlug}-${report.key}-${index}`} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {formatSlugToTitle(report.programSlug)}
            </td>
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
              {(() => {
                const ts = getLatestReportTs(report);
                return ts ? new Date(ts).toLocaleDateString() : "N/A";
              })()}
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
  );
}
