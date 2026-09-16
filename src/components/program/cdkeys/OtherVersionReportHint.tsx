"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle } from "react-icons/fi";
import { formatOtherVersionHint } from "@/src/lib/program/keyReportVersionFit";

interface OtherVersionReportHintProps {
  versions: string[];
  listedVersion?: string;
  className?: string;
}

export default function OtherVersionReportHint({ versions, listedVersion, className = "" }: OtherVersionReportHintProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!versions.length) return null;

  const message = formatOtherVersionHint(versions, listedVersion);

  const showTip = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    setTip({ top: r.top, left: r.left + r.width / 2 });
  };

  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setTip(null), 120);
  };

  const tooltip =
    mounted && tip
      ? createPortal(
          <div
            role="tooltip"
            onMouseEnter={showTip}
            onMouseLeave={scheduleHide}
            className="pointer-events-auto fixed z-80 w-max max-w-64 -translate-x-1/2 -translate-y-full rounded-sm border border-[#2a475e] bg-[#1b2838] px-2.5 py-1.5 text-[11px] leading-snug text-[#c6d4df] shadow-lg"
            style={{ top: tip.top - 6, left: tip.left }}>
            {message}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        className={`inline-flex shrink-0 cursor-help align-middle text-[#e8632a] ${className}`}
        aria-label={message}
        onMouseEnter={showTip}
        onMouseLeave={scheduleHide}
        onFocus={showTip}
        onBlur={scheduleHide}
        tabIndex={0}>
        <FiAlertTriangle className="h-3.5 w-3.5" aria-hidden />
      </span>
      {tooltip}
    </>
  );
}
