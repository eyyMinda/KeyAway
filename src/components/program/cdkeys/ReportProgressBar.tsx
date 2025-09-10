"use client";

interface ReportData {
  working: number;
  expired: number;
  limit_reached: number;
}

interface ReportProgressBarProps {
  reportData: ReportData;
  className?: string;
  showPercentage?: boolean;
}

export default function ReportProgressBar({
  reportData,
  className = "",
  showPercentage = true
}: ReportProgressBarProps) {
  const { working, expired, limit_reached } = reportData;
  const total = working + expired + limit_reached;

  // If no reports, show empty gray bar
  if (total === 0) {
    return (
      <div className={`flex flex-col items-center space-y-2 ${className}`}>
        {showPercentage && <span className="text-neutral-500 text-xs font-medium text-center">No reports</span>}
        <div className="w-24 h-2 bg-neutral-600 rounded-full">
          <div className="h-2 rounded-full bg-neutral-500"></div>
        </div>
      </div>
    );
  }

  const workingPercent = (working / total) * 100;
  const expiredPercent = (expired / total) * 100;
  const limitPercent = (limit_reached / total) * 100;

  const workingPercentRounded = Math.round(workingPercent);

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {showPercentage && (
        <div className="text-xs font-medium text-center">
          <span className="text-green-400">{workingPercentRounded}%</span>
        </div>
      )}

      <div className="w-24 bg-neutral-600 rounded-full h-2 overflow-hidden">
        <div className="flex h-full w-full">
          {/* Working (Primary/Green) */}
          {workingPercent > 0 && <div className="bg-green-500 h-full" style={{ width: `${workingPercent}%` }} />}
          {/* Expired (Error/Red) */}
          {expiredPercent > 0 && <div className="bg-red-500 h-full" style={{ width: `${expiredPercent}%` }} />}
          {/* Limit Reached (Warning/Orange) */}
          {limitPercent > 0 && <div className="bg-orange-500 h-full" style={{ width: `${limitPercent}%` }} />}
        </div>
      </div>
    </div>
  );
}
