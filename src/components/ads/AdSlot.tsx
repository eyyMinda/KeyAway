"use client";

/**
 * @fileoverview Labeled frame for an ad unit. It has no border or vertical padding of its own: pass the
 * background and bottom padding of the section it follows so it reads as that section's tail, not a new band.
 * Hidden while ad consent is pending or refused; shown (reserving space) while it is still being resolved.
 */
import type { ReactNode } from "react";
import { useAdConsent } from "@/src/hooks/useAdConsent";
import { ADS_ENABLED } from "@/src/lib/ads/adConfig";

type AdSlotProps = {
  children: ReactNode;
  /** Background/padding matching the neighbouring section, e.g. `static-bg pb-8`. */
  className?: string;
  /** Inner width cap; defaults to the site's `max-w-360` content column. */
  innerClassName?: string;
  showLabel?: boolean;
};

export default function AdSlot({
  children,
  className = "",
  innerClassName = "max-w-360",
  showLabel = true
}: AdSlotProps) {
  const { status } = useAdConsent();
  if (!ADS_ENABLED || status === "pending" || status === "denied") return null;

  return (
    <aside aria-label="Advertisement" className={className}>
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${innerClassName}`}>
        {showLabel ? (
          <div className="section-label-plain mb-1.5 text-center text-[10px] text-neutral-200">Advertisement</div>
        ) : null}
        {children}
      </div>
    </aside>
  );
}
