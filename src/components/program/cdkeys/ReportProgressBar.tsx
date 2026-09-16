"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReportData } from "@/src/types/program";

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
  const { working, expired, limit_reached, otherVersion = 0 } = reportData;
  const total = working + expired + limit_reached;
  const wrapRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const showTip = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    setTip({ top: r.top, left: r.left + r.width / 2 });
  };

  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setTip(null), 120);
  };

  const workingPercent = total > 0 ? (working / total) * 100 : 0;
  const expiredPercent = total > 0 ? (expired / total) * 100 : 0;
  const limitPercent = total > 0 ? (limit_reached / total) * 100 : 0;
  const workingPercentRounded = Math.round(workingPercent);

  const tooltip = mounted && tip
    ? createPortal(
        <div
          role="tooltip"
          onMouseEnter={showTip}
          onMouseLeave={scheduleHide}
          className="pointer-events-auto fixed z-80 w-max max-w-56 -translate-x-1/2 -translate-y-full rounded-sm border border-[#2a475e] bg-[#1b2838] px-2.5 py-1.5 text-[11px] leading-snug text-[#c6d4df] shadow-lg"
          style={{ top: tip.top - 6, left: tip.left }}>
          <div>Working: {working}</div>
          <div>Expired: {expired}</div>
          <div>Limit reached: {limit_reached}</div>
          {otherVersion > 0 ? <div className="text-[#8f98a0]">Other version: {otherVersion}</div> : null}
        </div>,
        document.body
      )
    : null;

  return (
    <div
      ref={wrapRef}
      className={`relative flex flex-col items-center space-y-1 ${className}`}
      onMouseEnter={showTip}
      onMouseLeave={scheduleHide}>
      {tooltip}
      {showPercentage && total > 0 ? (
        <div className="text-xs font-medium text-center">
          <span className="text-success-400">{workingPercentRounded}%</span>
        </div>
      ) : showPercentage && otherVersion === 0 ? (
        <span className="text-xs font-medium text-neutral-500">No reports</span>
      ) : null}

      <div className="w-full h-2 overflow-hidden rounded-full bg-neutral-600">
        {total === 0 ? (
          <div className="h-2 rounded-full bg-neutral-500" />
        ) : (
          <div className="flex h-full w-full">
            {workingPercent > 0 && <div className="h-full bg-success-500" style={{ width: `${workingPercent}%` }} />}
            {expiredPercent > 0 && <div className="h-full bg-error-500" style={{ width: `${expiredPercent}%` }} />}
            {limitPercent > 0 && <div className="h-full bg-warning-500" style={{ width: `${limitPercent}%` }} />}
          </div>
        )}
      </div>

      {otherVersion > 0 ? (
        <span className="text-[10px] leading-none text-[#8f98a0]">{otherVersion} other ver.</span>
      ) : null}
    </div>
  );
}
