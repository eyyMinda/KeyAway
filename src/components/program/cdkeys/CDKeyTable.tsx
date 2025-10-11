"use client";

import { useState, useEffect } from "react";
import { CDKey, CDKeyTableProps, ReportData } from "@/src/types";
import CDKeyItem from "@/src/components/program/cdkeys/CDKeyItem";
import CDKeyMobileCard from "@/src/components/program/cdkeys/CDKeyMobileCard";
import KeyStatusTooltip from "@/src/components/program/KeyStatusTooltip";
import { getExpiringKeysMessage } from "@/src/lib/cdKeyUtils";
import { useKeyReportData } from "@/src/hooks/useKeyReportData";

export default function CDKeyTable({ cdKeys, slug }: CDKeyTableProps) {
  const expiringKeysMessage = getExpiringKeysMessage(cdKeys);
  const { getReportData, loading, refreshReportData } = useKeyReportData(slug, cdKeys);
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

  // Handle report submission refresh
  const handleReportSubmitted = () => {
    refreshReportData();
  };

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-neutral-900 to-neutral-800">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10">
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
                  Free CD Keys & <span className="text-gradient-pro">Activation Codes</span>
                </h2>
                <p className="text-gray-300 text-sm sm:text-base lg:text-lg">
                  Activate working CD keys for premium software
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <KeyStatusTooltip />
              </div>
            </div>
            {expiringKeysMessage && (
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-400/30 rounded-xl">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-amber-300 font-medium">{expiringKeysMessage}</p>
                    <p className="text-amber-400/70 text-sm mt-1">
                      Note: Once expired, the key won&apos;t activate and your software&apos;s pro version will stop
                      working.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {cdKeys && cdKeys.length > 0 ? (
            <>
              {/* Mobile Card Layout */}
              <div className="block lg:hidden px-4 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cdKeys.map((cdKey: CDKey, i: number) => (
                    <CDKeyMobileCard
                      key={i}
                      cdKey={cdKey}
                      slug={slug}
                      reportData={reportDataMap.get(cdKey.key) || { working: 0, expired: 0, limit_reached: 0 }}
                      onReportSubmitted={handleReportSubmitted}
                    />
                  ))}
                </div>
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-8 py-6 text-left text-sm font-semibold text-gray-200 text-nowrap">Key</th>
                      <th className="px-8 py-6 text-center text-sm font-semibold text-gray-200">Status</th>
                      <th className="px-8 py-6 text-center text-sm font-semibold text-gray-200">Reports</th>
                      <th className="px-8 py-6 text-center text-sm font-semibold text-gray-200">Version</th>
                      <th className="px-8 py-6 text-center text-sm font-semibold text-gray-200">Valid From</th>
                      <th className="px-8 py-6 text-center text-sm font-semibold text-gray-200">Valid Until</th>
                      <th className="px-8 py-6 text-center text-sm font-semibold text-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {cdKeys.map((cdKey: CDKey, i: number) => (
                      <CDKeyItem
                        key={i}
                        cdKey={cdKey}
                        index={i}
                        slug={slug}
                        reportData={reportDataMap.get(cdKey.key) || { working: 0, expired: 0, limit_reached: 0 }}
                        onReportSubmitted={handleReportSubmitted}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="px-8 py-16 text-center">
              <div className="text-gray-500 text-6xl mb-6">🔑</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-3">No Keys Available</h3>
              <p className="text-gray-400 text-lg">There are currently no CD keys available for this program.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
