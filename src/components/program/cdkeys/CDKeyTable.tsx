"use client";

import { useState, useEffect } from "react";
import { CDKey, CDKeyTableProps, ReportData } from "@/src/types";
import CDKeyItem from "@/src/components/program/cdkeys/CDKeyItem";
import KeyStatusTooltip from "@/src/components/program/KeyStatusTooltip";
import { isKeyExpiringSoon } from "@/src/lib/cdKeyUtils";
import { useKeyReportData } from "@/src/hooks/useKeyReportData";

export default function CDKeyTable({ cdKeys, slug }: CDKeyTableProps) {
  const hasExpiringSoonKeys = cdKeys.some((key: CDKey) => isKeyExpiringSoon(key));
  const { getReportData, loading } = useKeyReportData(slug, cdKeys);
  const [reportDataMap, setReportDataMap] = useState<Map<string, ReportData>>(new Map());

  // Load report data for all keys
  useEffect(() => {
    const loadReportData = async () => {
      const dataMap = new Map<string, ReportData>();
      for (const cdKey of cdKeys) {
        const reportData = await getReportData(cdKey.key);
        dataMap.set(cdKey.key, reportData);
      }
      setReportDataMap(dataMap);
    };

    if (!loading) {
      loadReportData();
    }
  }, [cdKeys, getReportData, loading]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-neutral-800 rounded-2xl shadow-soft">
        <div className="px-6 py-4 border-b border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Free CD Keys & License Codes</h2>
              <p className="text-neutral-300 mt-1">Activate working license keys for premium software</p>
            </div>
            <KeyStatusTooltip />
          </div>
          {hasExpiringSoonKeys && (
            <div className="mt-3 p-3 bg-primary-900/20 border border-primary-500/30 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-primary-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-primary-300 text-sm">
                  Some keys are expiring within the next 24 hours. Use them soon!
                </span>
              </div>
            </div>
          )}
        </div>

        {cdKeys && cdKeys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-200 text-nowrap">Key</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-200">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-200">Reports</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-200">Version</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-200">Valid From</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-200">Valid Until</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700">
                {cdKeys.map((cdKey: CDKey, i: number) => (
                  <CDKeyItem
                    key={i}
                    cdKey={cdKey}
                    index={i}
                    slug={slug}
                    reportData={reportDataMap.get(cdKey.key) || { working: 0, expired: 0, limit_reached: 0 }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="text-neutral-500 text-4xl mb-4">🔑</div>
            <h3 className="text-lg font-semibold text-neutral-300 mb-2">No Keys Available</h3>
            <p className="text-neutral-400">There are currently no CD keys available for this program.</p>
          </div>
        )}
      </div>
    </div>
  );
}
