"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaChartLine,
  FaCheckCircle,
  FaCircle,
  FaClock,
  FaKey,
  FaMedal,
  FaStar,
  FaTimes,
  FaUser
} from "react-icons/fa";
import type { VisitorHintData } from "@/src/lib/visitors/publicVisitorContext";
import { trackInteraction } from "@/src/lib/analytics/trackInteraction";
import { INTERACTION_IDS, SECTIONS } from "@/src/lib/analytics/interactionCatalog";

export type VisitorTierHintVariant = "pill" | "feature";

interface VisitorTierHintProps {
  hint: VisitorHintData;
  /** `pill` = compact chip (default). `feature` = hero-style icon tile + title + short line. */
  variant?: VisitorTierHintVariant;
}

const ICON_SM = 12;
const ICON_MD = 16;
const ICON_LG = 20;

function tierIcon(tier: VisitorHintData["tier"], size: "sm" | "md" | "lg") {
  const px = size === "lg" ? ICON_LG : size === "md" ? ICON_MD : ICON_SM;
  const smColor =
    tier === "star" ? "text-yellow-300" : "text-primary-300";
  const colorClass = size === "sm" ? smColor : "";
  switch (tier) {
    case "star":
      return <FaStar className={colorClass} size={px} aria-hidden="true" />;
    case "regular":
      return <FaMedal className={colorClass} size={px} aria-hidden="true" />;
    case "returning":
      return <FaChartLine className={colorClass} size={px} aria-hidden="true" />;
    default:
      return <FaUser className={colorClass} size={px} aria-hidden="true" />;
  }
}

function tierFeatureShell(tier: VisitorHintData["tier"]): { boxClass: string; iconClass: string } {
  switch (tier) {
    case "star":
      return { boxClass: "bg-yellow-500/20", iconClass: "text-yellow-400" };
    case "regular":
      return { boxClass: "bg-primary-500/20", iconClass: "text-primary-400" };
    case "returning":
      return { boxClass: "bg-primary-500/20", iconClass: "text-primary-400" };
    default:
      return { boxClass: "bg-primary-500/20", iconClass: "text-primary-400" };
  }
}

export default function VisitorTierHint({ hint, variant = "pill" }: VisitorTierHintProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const stats = useMemo(
    () => [
      { icon: <FaClock size={11} aria-hidden="true" />, label: "visits", value: hint.visitCount },
      { icon: <FaCheckCircle size={11} aria-hidden="true" />, label: "reports", value: hint.reportCount },
      { icon: <FaKey size={11} aria-hidden="true" />, label: "suggestions", value: hint.suggestionCount }
    ],
    [hint.reportCount, hint.suggestionCount, hint.visitCount]
  );

  const shell = variant === "feature" ? tierFeatureShell(hint.tier) : null;

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
      void trackInteraction({
        interactionId: INTERACTION_IDS.heroVisitorHintOpen,
        sectionId: SECTIONS.home.hero
      });
    }
  };

  const statsRow = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
      {stats.map(item => (
        <span key={item.label} className="inline-flex items-center gap-1">
          <span className="text-primary-300/90">{item.icon}</span>
          <span className="tabular-nums text-gray-300">{item.value}</span>
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div ref={rootRef} className={variant === "feature" ? "relative w-full" : "relative inline-flex"}>
      {variant === "feature" ? (
        <section
          className="w-full rounded-xl border border-white/10 bg-linear-to-br from-primary-500/12 via-white/5 to-white/2 px-3 py-2 shadow-lg shadow-black/20 ring-1 ring-inset ring-white/6 backdrop-blur-sm"
          aria-label={`Visitor status: ${hint.label}`}>
          <div className="flex items-start gap-2.5">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${shell?.boxClass ?? ""}`}>
              <span className={shell?.iconClass ?? ""} aria-hidden="true">
                {tierIcon(hint.tier, "md")}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight text-white">{hint.label}</p>
              <p className="mt-0.5 text-xs leading-snug text-gray-400">{hint.message}</p>
            </div>
          </div>
          <div className="mt-2 border-t border-white/10 pt-2">{statsRow}</div>
        </section>
      ) : (
        <button
          type="button"
          onClick={togglePopover}
          className="inline-flex items-center gap-2 rounded-full border border-primary-400/30 bg-primary-500/10 px-2 py-1 text-[11px] text-primary-200 hover:bg-primary-500/20"
          aria-expanded={open}
          aria-label={`Visitor status: ${hint.label}`}>
          {tierIcon(hint.tier, "sm")}
          <span className="hidden sm:inline">{hint.label}</span>
          <FaCircle size={5} aria-hidden="true" />
        </button>
      )}
      {open ? (
        <div className="absolute left-0 top-9 z-30 w-72 rounded-xl border border-white/15 bg-gray-900/95 p-3 pr-9 pt-3 shadow-2xl backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
            aria-label="Close">
            <FaTimes size={14} aria-hidden="true" />
          </button>
          <p className="text-xs font-semibold text-white">{hint.label}</p>
          <p className="mt-1 text-xs text-gray-300">{hint.message}</p>
          <div className="mt-3 border-t border-white/10 pt-2">{statsRow}</div>
        </div>
      ) : null}
    </div>
  );
}
