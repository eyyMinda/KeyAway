"use client";

import { CDKey, ReportData } from "@/src/types";
import CDKeyActions from "./CDKeyActions";
import ReportProgressBar from "./ReportProgressBar";
import { getStatusColor } from "@/src/lib/cdKeyUtils";
import { useCopyTracking } from "@/src/hooks/useCopyTracking";

interface CDKeyMobileCardProps {
  cdKey: CDKey;
  slug: string;
  reportData: ReportData;
  onReportSubmitted?: () => void;
}

export default function CDKeyMobileCard({ cdKey, slug, reportData, onReportSubmitted }: CDKeyMobileCardProps) {
  const isDisabled = cdKey.status === "limit" || cdKey.status === "expired";

  useCopyTracking({ cdKey, slug });

  return (
    <div
      className={`bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 transition-all duration-300 max-w-sm mx-auto ${
        isDisabled ? "opacity-50" : "hover:bg-white/10"
      }`}>
      {/* Header with Key */}
      <div className="mb-4">
        <code className="block text-base font-mono text-white bg-neutral-600/60 px-4 py-3 rounded-xl whitespace-nowrap overflow-x-auto font-semibold border border-neutral-500/30">
          {cdKey.key}
        </code>
      </div>

      {/* Key Details */}
      <div className="mb-3 text-xs text-neutral-400">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-neutral-500">Program Version:</span>
            <div className="text-white font-medium">{cdKey.version}</div>
          </div>
          <div>
            <span className="text-neutral-500">Status:</span>
            <div className="mt-1">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(cdKey.status)}`}>
                {cdKey.status}
              </span>
            </div>
          </div>
          <div>
            <span className="text-neutral-500">Valid From:</span>
            <div className="text-white font-medium">{cdKey.validFrom?.split("T")[0]}</div>
          </div>
          <div>
            <span className="text-neutral-500">Valid Until:</span>
            <div className="text-white font-medium">{cdKey.validUntil?.split("T")[0]}</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <ReportProgressBar reportData={reportData} />
      </div>

      {/* Actions */}
      {!isDisabled && (
        <div className="pt-3 border-t border-white/10">
          <CDKeyActions cdKey={cdKey} isDisabled={isDisabled} slug={slug} onReportSubmitted={onReportSubmitted} />
        </div>
      )}
    </div>
  );
}
