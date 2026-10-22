"use client";

/**
 * @fileoverview Labeled frame for an ad unit. It has no border or vertical padding of its own: pass the
 * background and bottom padding of the section it follows so it reads as that section's tail, not a new band.
 * Hidden while ad consent is pending or refused, and collapses when its ads don't render (see `AdFrame`).
 */
import type { ReactNode } from "react";
import { useAdConsent } from "@/src/hooks/useAdConsent";
import { ADS_ENABLED } from "@/src/lib/ads/adConfig";
import type { AdPlacementId } from "@/src/lib/ads/adPlacements";
import AdFrame from "./AdFrame";

type AdSlotProps = {
  children: ReactNode;
  /** Stats id; add new ones to `AD_PLACEMENTS` so the admin Ads page can label and order them. */
  placement: AdPlacementId;
  /** Background/padding matching the neighbouring section, e.g. `static-bg pb-8`. */
  className?: string;
  /** Inner width cap; defaults to the site's `max-w-360` content column. */
  innerClassName?: string;
  showLabel?: boolean;
  /** False when the parent container already has the page's horizontal padding and width. */
  inset?: boolean;
};

export default function AdSlot({
  children,
  placement,
  className = "",
  innerClassName = "max-w-360",
  showLabel = true,
  inset = true
}: AdSlotProps) {
  const { status } = useAdConsent();
  if (!ADS_ENABLED || status === "pending" || status === "denied") return null;

  return (
    <AdFrame placement={placement} className={className}>
      <div className={inset ? `mx-auto px-4 sm:px-6 lg:px-8 ${innerClassName}` : undefined}>
        {showLabel ? (
          <div className="section-label-plain mb-1.5 text-center text-[10px] text-neutral-200">Advertisement</div>
        ) : null}
        {children}
      </div>
    </AdFrame>
  );
}
