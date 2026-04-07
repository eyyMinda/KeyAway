"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaChartLine,
  FaCheckCircle,
  FaCircle,
  FaClock,
  FaExclamationTriangle,
  FaKey,
  FaMedal,
  FaStar,
  FaUser
} from "react-icons/fa";
import { trackEvent } from "@/src/lib/analytics/trackEvent";
import type { VisitorHintData } from "@/src/lib/visitors/publicVisitorContext";

interface VisitorTierHintProps {
  hint: VisitorHintData;
}

function tierIcon(tier: VisitorHintData["tier"]) {
  switch (tier) {
    case "star":
      return <FaStar className="text-yellow-300" size={12} aria-hidden="true" />;
    case "regular":
      return <FaMedal className="text-primary-300" size={12} aria-hidden="true" />;
    case "returning":
      return <FaChartLine className="text-primary-300" size={12} aria-hidden="true" />;
    default:
      return <FaUser className="text-primary-300" size={12} aria-hidden="true" />;
  }
}

export default function VisitorTierHint({ hint }: VisitorTierHintProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackedVisibleRef = useRef(false);

  const stats = useMemo(
    () => [
      { icon: <FaClock size={11} aria-hidden="true" />, label: "visits", value: hint.visitCount },
      { icon: <FaCheckCircle size={11} aria-hidden="true" />, label: "reports", value: hint.reportCount },
      { icon: <FaKey size={11} aria-hidden="true" />, label: "suggestions", value: hint.suggestionCount }
    ],
    [hint.reportCount, hint.suggestionCount, hint.visitCount]
  );

  useEffect(() => {
    if (trackedVisibleRef.current) return;
    trackedVisibleRef.current = true;
    trackEvent("social_click", { social: "visitor_hint_visible", path: window.location.pathname });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const togglePopover = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      trackEvent("social_click", { social: "visitor_hint_open", path: window.location.pathname });
    }
  };

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={togglePopover}
        className="inline-flex items-center gap-2 rounded-full border border-primary-400/30 bg-primary-500/10 px-2 py-1 text-[11px] text-primary-200 hover:bg-primary-500/20"
        aria-expanded={open}
        aria-label={`Visitor status: ${hint.label}`}>
        {tierIcon(hint.tier)}
        <span className="hidden sm:inline">{hint.label}</span>
        <FaCircle size={5} aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute left-0 top-9 z-30 w-72 rounded-xl border border-white/15 bg-gray-900/95 p-3 shadow-2xl backdrop-blur-sm">
          <p className="text-xs font-semibold text-white">{hint.label}</p>
          <p className="mt-1 text-xs text-gray-300">{hint.message}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-2 text-[11px] text-gray-300">
            {stats.map(item => (
              <span key={item.label} className="inline-flex items-center gap-1">
                <span className="text-primary-300">{item.icon}</span>
                <span className="text-gray-400">{item.value}</span>
                <span>{item.label}</span>
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-200">
            <FaExclamationTriangle size={10} aria-hidden="true" />
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
